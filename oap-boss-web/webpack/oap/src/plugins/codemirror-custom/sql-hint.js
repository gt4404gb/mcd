import CodeMirror from 'codemirror';
import {
  getSqlTableBySchema,
  getSqlFieldByTable,
} from '@/api/oap/sql_search.js';

(function() {
	var tables;
	var defaultTable;
	var keywords;
	var identifierQuote;
	var CONS = {
		QUERY_DIV: ";",
		ALIAS_KEYWORD: "AS"
	};
	var Pos = CodeMirror.Pos,
		cmpPos = CodeMirror.cmpPos;
 
	function getKeywords(editor) {
		var mode = editor.doc.modeOption;
		if (mode === "sql") mode = "text/x-sql";
		return CodeMirror.resolveMode(mode).keywords;
	}
 
	function getIdentifierQuote(editor) {
		var mode = editor.doc.modeOption;
		if (mode === "sql") mode = "text/x-sql";
		return CodeMirror.resolveMode(mode).identifierQuote || "`";
	}
	
	function cleanName(name) {
	  // 获取名称并且去除“.”
	  if (name.charAt(0) == ".") {
	    name = name.substr(1);
	  }
	  // 使用单引号替换双引号
	  // 并且去除单个引号
	  var nameParts = name.split(identifierQuote+identifierQuote);
	  for (var i = 0; i < nameParts.length; i++)
	    nameParts[i] = nameParts[i].replace(new RegExp(identifierQuote,"g"), "");
	  return nameParts.join(identifierQuote);
	}
 
	function isArray(val) { //判定val是否是数组
		return Object.prototype.toString.call(val) == "[object Array]"
	}
 
	function getText(item) { //获取item的字符串表达
		return typeof item == "string" ? item : item.text;
	}
 
	function match(string, word) { //判定word是否以string开头
		var len = string.length;
		var sub = getText(word).substr(0, len);
		return string.toUpperCase() === sub.toUpperCase();
	}
 
	function addMatches(result, search, wordlist, formatter) { //根据search搜索wordlist对象，将符合条件的结果通过formatter格式化，然后添加到result数组中。
		if (isArray(wordlist)) { //如果是数组，则表示传入的worklist包含的是列名结构。
			for (var i = 0; i < wordlist.length; i++) {
				if (match(search, wordlist[i])) {
					result.push(formatter(wordlist[i]));
				}
			}
		} else { //如果不是数组，则表示传入的worklist包含的是用户名或者表名结构。
			for (var world in wordlist) {
				if (match(search, world)) {
					result.push(formatter(world));
				}
			}
		}
	}
	
	function fetchStartPoint(token) {//根据token获取截取开始的位置
		var index = token.string.lastIndexOf("\.");
		if (index < 0) {
			return token.start;
		} else {
			return token.start + index + 1;
		}
	};
	
	function getTableByAllTableName(allTableName){//根据全表名从tables中获取表Obj。如果找不到该表，则返回null。全表名用“.”分割。
		var nameParts = allTableName.split(".");
		var theTable = tables;
    // console.log(1)
    // if (nameParts.length === 2) {
    //   await getSqlTableBySchema(nameParts[1]).then(res => {
    //     console.log(2)
    //     console.log('ressssss = ', res);
    //   }).catch(() => {

    //   })
    // }
    // console.log(3)
		for(var i = 0; i < nameParts.length; i++){
			if (Object.prototype.hasOwnProperty.call(theTable, nameParts[i])){
				theTable = theTable[nameParts[i]];
			}else{
				theTable = null;
				break;
			}
		}
		return theTable;
	}
	
	function findTableByAlias(alias, editor) {//尝试通过昵称查询表名
	  var doc = editor.doc;
	  var fullQuery = doc.getValue();
	  var aliasUpperCase = alias.toUpperCase();
	  var previousWord = "";
	  var table = "";
	  var separator = [];
	  var validRange = {
	    start: Pos(0, 0),
	    end: Pos(editor.lastLine(), editor.getLineHandle(editor.lastLine()).length)
	  };
	
	  //add separator
	  var indexOfSeparator = fullQuery.indexOf(CONS.QUERY_DIV);
	  while(indexOfSeparator != -1) {
	    separator.push(doc.posFromIndex(indexOfSeparator));
	    indexOfSeparator = fullQuery.indexOf(CONS.QUERY_DIV, indexOfSeparator+1);
	  }
	  separator.unshift(Pos(0, 0));
	  separator.push(Pos(editor.lastLine(), editor.getLineHandle(editor.lastLine()).text.length));
	
	  //find valid range
	  var prevItem = null;
	  var current = editor.getCursor()
	  for (var i = 0; i < separator.length; i++) {
	    if ((prevItem == null || cmpPos(current, prevItem) > 0) && cmpPos(current, separator[i]) <= 0) {
	      validRange = {start: prevItem, end: separator[i]};
	      break;
	    }
	    prevItem = separator[i];
	  }
	
	  if (validRange.start) {
	    var query = doc.getRange(validRange.start, validRange.end, false);
	
	    for (var i = 0; i < query.length; i++) {
	      var lineText = query[i];
	      eachWord(lineText, function(word) {
	        var wordUpperCase = word.toUpperCase();
	        if (wordUpperCase === aliasUpperCase && getTableByAllTableName(previousWord))
	          table = previousWord;
	        if (wordUpperCase !== CONS.ALIAS_KEYWORD)
	          previousWord = word;
	      });
	      if (table) break;
	    }
	  }
	  return table;
	}
	function eachWord(lineText, f) {
	  var words = lineText.split(/\s+/)
	  for (var i = 0; i < words.length; i++)
	    if (words[i]) f(words[i].replace(/[,;]/g, ''))
	}
 
	function nameCompletion(cur, token, result, editor) {
		// Try to complete table, column names and return start position of completion
		var useIdentifierQuotes = false;
		var nameParts = [];
		var start = fetchStartPoint(token);
		var cont = true;
		while (cont) {//获取表名词组并存储到nameParts
			cont = (token.string.charAt(0) == ".");
			useIdentifierQuotes = useIdentifierQuotes || (token.string.charAt(0) == identifierQuote);
 
			nameParts.unshift(cleanName(token.string));
 
			token = editor.getTokenAt(Pos(cur.line, token.start));
			if (token.string == ".") {
				cont = true;
				token = editor.getTokenAt(Pos(cur.line, token.start));
			}
		}
    // console.log('nameParts = ', nameParts);
		var theLastString = nameParts.pop();
 		var allTableName = nameParts.join(".");
    // console.log('allTableName = ', allTableName);
		var theTable = getTableByAllTableName(allTableName);//尝试根据全表名获取表Obj
		if(theTable == null && nameParts.length == 1){//如果不能根据全表名获取到Obj，并且nameParts长度为1，则尝试根据表昵称获取表Obj
			let theTableName = findTableByAlias(nameParts[0],editor);
			theTable = getTableByAllTableName(theTableName);
		} else if (theTable == null && nameParts.length == 2) {
			let theTableName = findTableByAlias(nameParts[0],editor);
			theTableName = `${theTableName}.${nameParts[1]}`;
			theTable = getTableByAllTableName(theTableName);
		}
		addMatches( //匹配当前位置的用户、表、列
			result,
			theLastString,
			theTable,
			function(w) { //将返回结果包装成标准格式，并赋予table类名
				if (typeof w === 'object') {
					w.className = "CodeMirror-hint-table";
				} else {
					w = {
						text: w,
						className: "CodeMirror-hint-table"
					};
				}
				return w;
			}
		);
		return start;
	}
 
	//绑定智能提醒事件处理函数
	CodeMirror.registerHelper("hint", "sql", function(editor, options) {
		tables = options && options.tables;
		var disableKeywords = options && options.disableKeywords;
		keywords = getKeywords(editor);
		identifierQuote = getIdentifierQuote(editor);
 
		var cur = editor.getCursor();
		var result = [];
		var token = editor.getTokenAt(cur),
			start, end, search;
		if (token.end > cur.ch) {
			token.end = cur.ch;
			token.string = token.string.slice(0, cur.ch - token.start);
		}
		if (token.string.match(/^[.`"\w@]\w*$/)) {
			search = token.string;
			start = token.start;
			end = token.end;
		} else {
			start = end = cur.ch;
			search = "";
		}
		if (search.charAt(0) == "." || search.charAt(0) == identifierQuote) {
      // console.log('cur = ', cur)
      // console.log('token = ', token)
      // console.log('result = ', result)
      // console.log('editor = ', editor)
			start = nameCompletion(cur, token, result, editor);
		} else {
			addMatches( //匹配用户、表、列
				result,
				search,
				tables,
				function(w) { //将返回结果包装成标准格式，并赋予table类名
					if (typeof w === 'object') {
						w.className = "CodeMirror-hint-table";
					} else {
						w = {
							text: w,
							className: "CodeMirror-hint-table"
						};
					}
					return w;
				}
			);
			if (!disableKeywords) //匹配内置关键词
				addMatches(result, search, keywords, function(w) {
					return {
						text: w.toUpperCase(),
						className: "CodeMirror-hint-keyword"
					};
				});
		}
		return {
			list: result,
			from: Pos(cur.line, start),
			to: Pos(cur.line, end)
		};
	});
})();