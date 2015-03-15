#!/usr/bin/env node

var program = require('commander')



program

	.version('0.0.0')

	.description('Recursively gather JSON filesize data')

	.option('-f --file_relevance <bytes>','The minimum size a file can be for it to be included in the output',Number)

	.option('-d --directory_relevance <bytes>','The minimum size a directory can be for it to be included in the output',Number)

	.option('-r --relevance <bytes>','The minimum size a directory or a file can be for it to be included in the output',Number)

	.option('-o --output <name>','The output path of the tree json',String)

	.option('-p --pretty','Pretty print the JSON tree output')

	.option('-i --ignore <csv of patterns>','Case insensitive patterns to ignore',regexCSV)

	.parse(process.argv)







var Promise = require('promise')

var fs = require('fs')

var readdir = Promise.denodeify(fs.readdir)

var stat = Promise.denodeify(fs.stat)

var R = require('ramda')



//must be > 1000b to add to the tree

var file_relevance = program.file_relevance || 0

var directory_relevance = program.directory_relevance || 0

var relevance = program.relevance || 0

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

			tree.isDirectory = true

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



						children.push(branch)

					}

				}

				return children

			},[])



			return Promise.all(traversals)

				.then(function(branches){

					tree.size += R.sum(R.pluck('size',branches))



					tree.children = tree.children.reduce(function(children, branch){

						if(branch.size > relevance){

							if(branch.isDirectory){

								branch.size > directory_relevance && children.push(branch)

							} else {

								branch.size > file_relevance && children.push(branch)

							}

						}



						return children

					},[])







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





if(require.main === module){

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

}





module.exports = function(options){

	options = options || {}

	ignores = options.ignores || []

	file_relevance = options.file_relevance || 0

	directory_relevance = options.directory_relevance || 0

	relevance = options.relevance || 0

	tree = options.tree || { name: '.' }



	return parseDirectory(tree)

}