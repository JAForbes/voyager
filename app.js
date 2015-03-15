var fs = require('fs')
var Promise = require('promise')
var readdir = Promise.denodeify(fs.readdir)
var stat = Promise.denodeify(fs.stat)
var R = require('ramda')
var program = require('commander')


program
	.version('0.0.0')
	.description('Recursively gather JSON filesize data')
	.option('-r --file_relevance <bytes>','The minimum size a file can be for it to be included in the output',Number)
	.option('-d --directory_relevance <bytes>','The minimum size a directory can be for it to be included in the output',Number)
	.option('-o --output <name>','The output path of the tree json',String)
	.option('-p --pretty','Pretty print the JSON tree output')
	.option('-i --ignore <csv of patterns>','Case insensitive patterns to ignore',regexCSV)
	.parse(process.argv)

//must be > 1000b to add to the tree
var file_size_relevant = program.file_relevance || 0
var directory_size_relevance = program.directory_relevance || 0
var ignores = program.ignore || []

var tree = {}


function regexCSV(str){
	return str.split(',').map(function(pattern){
		return new RegExp(pattern,'i')
	})
}

parseDirectory = function(tree){
	return readdir(tree.name)
		.then(getStats.bind(null,tree.name))
		.then(function(stats){
			var traversals = []
			tree.size = tree.size || 0
			tree.size += R.sum(R.pluck('size',stats))
			tree.children = stats.reduce(function(children, stat){
				var ignore = ''.match.bind(stat.filename)
				var noMatch = !ignores.some(ignore)
				if(noMatch){
					var branch = {
						name: tree.name + '/'+ stat.filename,
						size: stat.size,
						isDirectory: stat.isDirectory()
					}
					if(branch.isDirectory){
						traversals.push(parseDirectory(branch))
						children.push(branch)
					} else {
						branch.size > file_size_relevant && children.push(branch)
					}
				}
				return children
			},[])


			return Promise.all(traversals)
				.then(function(branches){
					tree.size += R.sum(R.pluck('size',branches))

					tree.children = branches.map(function(branch){
						return branch.size > directory_size_relevance && branch || branch.name
					})



					return tree
				})


		})

}

getStats = function(root,files){

	return Promise.all( R.map(function(path){
		return stat(root + '/' + path)
	}, files) )
		.then(
			R.zipWith(R.call)( R.map(R.assoc('filename'),files) )
	  	)

}

parseDirectory({
	name: '.'
}).then(function(tree){

	var json = program.pretty ?
		JSON.stringify(tree,null,2) :
		JSON.stringify(tree)

	if(program.output){
		fs.writeFileSync(program.output,json)
	} else {
		console.log(json)
	}

},console.error)