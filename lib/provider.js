'use babel';

import * as fs from 'fs';
import * as path from 'path';

export default class AcidProvider {

    constructor () {

        this.selector = '.source.acid';
        this.disableForSelector = '.source.acid .comment, .source.acid .string'
        this.inclusionPriority = 100;
        this.excludeLowerPriority = true;

        this.lambdas = ['putchar', 'getchar', 'abort', 'eq', 'neq', 'le', 'lt', 'gt', 'ge', 'and', 'or', 'xor', 'not'];
        this.keywords = ['define', 'lambda', 'use', 'hastype', 'match', 'tuple', 'type', '_'];
    }

    getSuggestions ({editor, bufferPosition, scopeDescriptor, prefix, activatedManually}) {
        let line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition]);
        let _prefix = prefix.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        return new Promise ((resolve) => {

            let suggestions = this.buildLambda(this.lambdas);

            if (line.endsWith('(' + prefix)) { // new expression
                suggestions = suggestions.concat(this.buildKeywords(this.keywords));
            }

            if (line.endsWith('(use ' + prefix)) {
                suggestions = []; // reset suggestions, to take only "modules"

                let walk = (dir, done) => {
                    var results = [];
                    fs.readdir(dir, function(err, list) {
                        if (err) return done(err);
                        var pending = list.length;
                        if (!pending) return done(null, results);
                            list.forEach(function(file) {
                                file = path.resolve(dir, file);
                                fs.stat(file, function(err, stat) {
                                    if (stat && stat.isDirectory()) {
                                        walk(file, function(err, res) {
                                            results = results.concat(res);
                                            if (!--pending) done(null, results);
                                        });
                                    } else {
                                        results.push(file);
                                        if (!--pending) done(null, results);
                                    }
                                });
                            });
                    });
                };

                let dir = path.parse(editor.getPath()).dir;
                walk (dir, (err, files) => {
                    if (err) console.log(err);
                    for (file of files) {
                        if (file.endsWith('.acid') && file != editor.getPath()) {
                            let name = file.replace(dir, '');
                            let file = name.replace('\\', '/').replace('/', '');
                            while (name.includes ('/') || name.includes ('\\')) name = name.replace('\\', '/').replace('/', '::');
                            name = name.replace('.acid', '').replace(/^::/, '');
                            suggestions.push({
                                text: name,
                                type: 'import',
                                description: 'From file ' + file + '.'
                            });
                        }
                    }
                    resolve (suggestions.filter((s) => { return s.text.match(_prefix); }));
                });
            }

            if (suggestions.length > 0) {
                suggestions = suggestions.filter((suggestion) => {
                    return suggestion.text.match (_prefix) != null && suggestion.text != null;
                })
                resolve(suggestions);
            }
        });
    }

    buildLambda (names) {
        let res = [];
        for (name of names) {
            res.push ({
                text: name + ' ',
                displayText: name,
                type: 'function',
                iconHTML: '<span>λ</span>'
            });
        }
        return res;
    }

    buildKeywords (kws) {
        let res = [];
        for (kw of kws) {
            res.push ({
                text: kw + ' ',
                displayText: kw,
                type: 'keyword',
            });
        }
        return res;
    }

}
