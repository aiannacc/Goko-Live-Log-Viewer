/*jslint browser: true, devel: true, indent: 4, vars: true, nomen: true, regexp: true, forin: true, white:true */
/*globals $, _, GS, FS */


//esoteric functions and card definitions
var kinggen_utils = {};
kinggen_utils = (function () {
	"use strict";
	var pubfuncts = {};
	pubfuncts.sets = {};
	pubfuncts.hideKingdomGenerator = false;
	pubfuncts.myCachedCards;
	//standardizes card names
	pubfuncts.canonizeName = function (n) {
            return n.toLowerCase().replace(/\W+/g, '');
    };

	//array of card:set/cost relationships, card name as key
	var setsComp = {
            cellar: "B2",
            chapel: "B2",
            moat: "B2",
            chancellor: "B3",
            village: "B3",
            woodcutter: "B3",
            workshop: "B3",
            bureaucrat: "B4",
            feast: "B4",
            gardens: "B4",
            militia: "B4",
            moneylender: "B4",
            remodel: "B4",
            smithy: "B4",
            spy: "B4",
            thief: "B4",
            throneroom: "B4",
            councilroom: "B5",
            festival: "B5",
            laboratory: "B5",
            library: "B5",
            market: "B5",
            mine: "B5",
            witch: "B5",
            adventurer: "B6",
            courtyard: "I2",
            pawn: "I2",
            secretchamber: "I2",
            greathall: "I3",
            masquerade: "I3",
            shantytown: "I3",
            steward: "I3",
            swindler: "I3",
            wishingwell: "I3",
            baron: "I4",
            bridge: "I4",
            conspirator: "I4",
            coppersmith: "I4",
            ironworks: "I4",
            miningvillage: "I4",
            scout: "I4",
            duke: "I5",
            minion: "I5",
            saboteur: "I5",
            torturer: "I5",
            tradingpost: "I5",
            tribute: "I5",
            upgrade: "I5",
            harem: "I6",
            nobles: "I6",
            embargo: "S2",
            haven: "S2",
            lighthouse: "S2",
            nativevillage: "S2",
            pearldiver: "S2",
            ambassador: "S3",
            fishingvillage: "S3",
            lookout: "S3",
            smugglers: "S3",
            warehouse: "S3",
            caravan: "S4",
            cutpurse: "S4",
            island: "S4",
            navigator: "S4",
            pirateship: "S4",
            salvager: "S4",
            seahag: "S4",
            treasuremap: "S4",
            bazaar: "S5",
            explorer: "S5",
            ghostship: "S5",
            merchantship: "S5",
            outpost: "S5",
            tactician: "S5",
            treasury: "S5",
            wharf: "S5",
            herbalist: "A2",
            apprentice: "A5",
            transmute: "Ap",
            vineyard: "Ap",
            apothecary: "Ap",
            scryingpool: "Ap",
            university: "Ap",
            alchemist: "Ap",
            familiar: "Ap",
            philosophersstone: "Ap",
            golem: "Ap",
            possession: "Ap",
            loan: "P3",
            traderoute: "P3",
            watchtower: "P3",
            bishop: "P4",
            monument: "P4",
            quarry: "P4",
            talisman: "P4",
            workersvillage: "P4",
            city: "P5",
            contraband: "P5",
            countinghouse: "P5",
            mint: "P5",
            mountebank: "P5",
            rabble: "P5",
            royalseal: "P5",
            vault: "P5",
            venture: "P5",
            goons: "P6",
            grandmarket: "P6",
            hoard: "P6",
            bank: "P7",
            expand: "P7",
            forge: "P7",
            kingscourt: "P7",
            peddler: "P8",
            hamlet: "C2",
            fortuneteller: "C3",
            menagerie: "C3",
            farmingvillage: "C4",
            horsetraders: "C4",
            remake: "C4",
            tournament: "C4",
            youngwitch: "C4",
            harvest: "C5",
            hornofplenty: "C5",
            huntingparty: "C5",
            jester: "C5",
            fairgrounds: "C6",
            crossroads: "H2",
            duchess: "H2",
            foolsgold: "H2",
            develop: "H3",
            oasis: "H3",
            oracle: "H3",
            scheme: "H3",
            tunnel: "H3",
            jackofalltrades: "H4",
            noblebrigand: "H4",
            nomadcamp: "H4",
            silkroad: "H4",
            spicemerchant: "H4",
            trader: "H4",
            cache: "H5",
            cartographer: "H5",
            embassy: "H5",
            haggler: "H5",
            highway: "H5",
            illgottengains: "H5",
            inn: "H5",
            mandarin: "H5",
            margrave: "H5",
            stables: "H5",
            bordervillage: "H6",
            farmland: "H6",
            poorhouse: "D1",
            beggar: "D2",
            squire: "D2",
            vagrant: "D2",
            forager: "D3",
            hermit: "D3",
            marketsquare: "D3",
            sage: "D3",
            storeroom: "D3",
            urchin: "D3",
            armory: "D4",
            deathcart: "D4",
            feodum: "D4",
            fortress: "D4",
            ironmonger: "D4",
            marauder: "D4",
            procession: "D4",
            rats: "D4",
            scavenger: "D4",
            wanderingminstrel: "D4",
            bandofmisfits: "D5",
            banditcamp: "D5",
            catacombs: "D5",
            count: "D5",
            counterfeit: "D5",
            cultist: "D5",
            graverobber: "D5",
            junkdealer: "D5",
            knights: "D5",
            mystic: "D5",
            pillage: "D5",
            rebuild: "D5",
            rogue: "D5",
            altar: "D6",
            huntinggrounds: "D6",
            blackmarket: "X3",
            envoy: "X4",
            walledvillage: "X4",
            governor: "X5",
            stash: "X5",
            candlestickmaker: "G2",
            stonemason: "G2",
            doctor: "G3",
            masterpiece: "G3",
            advisor: "G4",
            herald: "G4",
            plaza: "G4",
            taxman: "G4",
            baker: "G5",
            butcher: "G5",
            journeyman: "G5",
            merchantguild: "G5",
            soothsayer: "G5"
        };

	//array of set/cost meanings
	var setNames = {
            '1': 'cost1',
            '2': 'cost2',
            '3': 'cost3',
            '4': 'cost4',
            '5': 'cost5',
            '6': 'cost6',
            '7': 'cost7',
            '8': 'cost8',
            'p': 'costpotion',
            'B': 'baseset',
            'I': 'intrigue',
            'S': 'seaside',
            'A': 'alchemy',
            'P': 'prosperity',
            'C': 'cornucopia',
            'H': 'hinterlands',
            'D': 'darkages',
            'X': 'promos',
            'G': 'guilds'
        };

	//magic (what is this doing, exactly?)
	pubfuncts.types = {};
    FS.Dominion.CardBuilder.Data.cards.map(function (card) {
        pubfuncts.types[card.name[0]] = card.type;
    });

	pubfuncts.set_parser = (function () {
		var parser = {trace: function trace() {},
			yy: {},
		symbols_: {"error":2,"cc":3,"c":4,"ee":5,",":6,"EOF":7,"e":8,"n":9,"+":10,"/":11,"*":12,"(":13,")":14,"ID":15,"NUMBER":16,"$accept":0,"$end":1},
		terminals_: {2:"error",6:",",7:"EOF",10:"+",11:"/",12:"*",13:"(",14:")",15:"ID",16:"NUMBER"},
		productions_: [0,[3,1],[4,3],[4,2],[5,1],[5,2],[8,3],[8,3],[8,3],[8,3],[8,3],[8,1],[9,1]],
		performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$) {
			/* this == yyval */

			var $0 = $$.length - 1;
			var i, s;
			switch (yystate) {
				case 1:return this.$;
				case 2: this.$ = $$[$0-2].concat($$[$0]);
						break;
				case 3: this.$ = $$[$0-1];
						break;
				case 4: this.$ = [ $$[$0] ];
						break;
				case 5: this.$ = []; for (i=0;i<$$[$0-1];i++) { this.$.push($$[$0]); }
						break;
				case 6:this.$ = $$[$0-2];for(i in $$[$0]) { this.$[i]=$$[$0][i]+(this.$[i]||0); }
					   break;
				case 7:this.$ = $$[$0-2];for(i in $$[$0]) { delete(this.$[i]); }
					   break;
				case 8:this.$ = {};for(i in $$[$0]) { if($$[$0-2][i]) { this.$[i]=Math.min($$[$0-2][i],$$[$0][i]); } }
					   break;
				case 9:this.$ = $$[$0-1];
					   break;
				case 10:this.$ = {};if($$[$0-2]){for(i in $$[$0]){ this.$[i]=$$[$0][i]*$$[$0-2];}}
						break;
				case 11:this.$ = {};s = pubfuncts.sets[pubfuncts.canonizeName(yytext)];if(!s){throw new Error('Unknown card or set: '+yytext);} for (i in s){this.$[i] = s[i];}
						break;
				case 12:this.$ = Number(yytext);
						break;
			}
		},
		table: [{3:1,4:2,5:3,8:4,9:5,13:[1,6],15:[1,7],16:[1,8]},{1:[3]},{1:[2,1]},{6:[1,9],7:[1,10]},{10:[1,11],11:[1,12],12:[1,13],6:[2,4],7:[2,4]},{8:14,12:[1,15],13:[1,6],9:16,15:[1,7],16:[1,8]},{8:17,13:[1,6],9:16,15:[1,7],16:[1,8]},{7:[2,11],6:[2,11],10:[2,11],11:[2,11],12:[2,11],14:[2,11]},{13:[2,12],15:[2,12],16:[2,12],12:[2,12]},{4:18,5:3,8:4,9:5,13:[1,6],15:[1,7],16:[1,8]},{1:[2,3]},{8:19,13:[1,6],9:16,15:[1,7],16:[1,8]},{8:20,13:[1,6],9:16,15:[1,7],16:[1,8]},{8:21,13:[1,6],9:16,15:[1,7],16:[1,8]},{10:[1,11],11:[1,12],12:[1,13],6:[2,5],7:[2,5]},{8:22,13:[1,6],9:16,15:[1,7],16:[1,8]},{12:[1,15]},{14:[1,23],10:[1,11],11:[1,12],12:[1,13]},{1:[2,2]},{10:[2,6],11:[1,12],12:[1,13],7:[2,6],6:[2,6],14:[2,6]},{10:[2,7],11:[2,7],12:[2,7],7:[2,7],6:[2,7],14:[2,7]},{10:[2,8],11:[2,8],12:[2,8],7:[2,8],6:[2,8],14:[2,8]},{10:[2,10],11:[2,10],12:[2,10],7:[2,10],6:[2,10],14:[2,10]},{7:[2,9],6:[2,9],10:[2,9],11:[2,9],12:[2,9],14:[2,9]}],
		defaultActions: {2:[2,1],10:[2,3],18:[2,2]},
		parseError: function parseError(str,hash){if(hash.recoverable){this.trace(str);}else{throw new Error(str);}},
		parse: function parse(input) {
			var self = this, stack = [0], vstack = [null], lstack = [], table = this.table, yytext = '', yylineno = 0, yyleng = 0, recovering = 0, TERROR = 2, EOF = 1;
			this.lexer.setInput(input);
			this.lexer.yy = this.yy;
			this.yy.lexer = this.lexer;
			this.yy.parser = this;
			if (typeof this.lexer.yylloc === 'undefined') {
				this.lexer.yylloc = {};
			}
			var yyloc = this.lexer.yylloc;
			lstack.push(yyloc);
			var ranges = this.lexer.options && this.lexer.options.ranges;
			if (typeof this.yy.parseError === 'function') {
				this.parseError = this.yy.parseError;
			} else {
				this.parseError = Object.getPrototypeOf(this).parseError;
			}
			function popStack(n) {
				stack.length = stack.length - 2 * n;
				vstack.length = vstack.length - n;
				lstack.length = lstack.length - n;
			}
			function lex() {
				var token;
				token = self.lexer.lex() || EOF;
				if (typeof token !== 'number') {
					token = self.symbols_[token] || token;
				}
				return token;
			}
			var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
			while (true) {
				state = stack[stack.length - 1];
				if (this.defaultActions[state]) {
					action = this.defaultActions[state];
				} else {
					if (symbol === null || typeof symbol === 'undefined') {
						symbol = lex();
					}
					action = table[state] && table[state][symbol];
				}
				if (typeof action === 'undefined' || !action.length || !action[0]) {
					var errStr = '';
					expected = [];
					for (p in table[state]) {
						if (this.terminals_[p] && p > TERROR) {
							expected.push('\'' + this.terminals_[p] + '\'');
						}
					}
					if (this.lexer.showPosition) {
						errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + this.lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
					} else {
						errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
					}
					this.parseError(errStr, {
						text: this.lexer.match,
						token: this.terminals_[symbol] || symbol,
						line: this.lexer.yylineno,
						loc: yyloc,
						expected: expected
					});
				}
				if (action[0] instanceof Array && action.length > 1) {
					throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
				}
				switch (action[0]) {
					case 1:
						stack.push(symbol);
						vstack.push(this.lexer.yytext);
						lstack.push(this.lexer.yylloc);
						stack.push(action[1]);
						symbol = null;
						if (!preErrorSymbol) {
							yyleng = this.lexer.yyleng;
							yytext = this.lexer.yytext;
							yylineno = this.lexer.yylineno;
							yyloc = this.lexer.yylloc;
							if (recovering > 0) {
								recovering--;
							}
						} else {
							symbol = preErrorSymbol;
							preErrorSymbol = null;
						}
						break;
					case 2:
						len = this.productions_[action[1]][1];
						yyval.$ = vstack[vstack.length - len];
						yyval._$ = {
							first_line: lstack[lstack.length - (len || 1)].first_line,
							last_line: lstack[lstack.length - 1].last_line,
							first_column: lstack[lstack.length - (len || 1)].first_column,
							last_column: lstack[lstack.length - 1].last_column
						};
						if (ranges) {
							yyval._$.range = [
								lstack[lstack.length - (len || 1)].range[0],
								lstack[lstack.length - 1].range[1]
									];
						}
						r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
						if (typeof r !== 'undefined') {
							return r;
						}
						if (len) {
							stack = stack.slice(0, -1 * len * 2);
							vstack = vstack.slice(0, -1 * len);
							lstack = lstack.slice(0, -1 * len);
						}
						stack.push(this.productions_[action[1]][0]);
						vstack.push(yyval.$);
						lstack.push(yyval._$);
						newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
						stack.push(newState);
						break;
					case 3:
						return true;
				}
			}
			return true;
		}};
		/* generated by jison-lex 0.2.0 */
		var lexer = (function(){
			var lexer = {

				EOF:1,

			parseError:function parseError(str,hash){if(this.yy.parser){this.yy.parser.parseError(str,hash);}else{throw new Error(str);}},

			// resets the lexer, sets new input
			setInput:function (input){this._input=input;this._more=this._backtrack=this.done=false;this.yylineno=this.yyleng=0;this.yytext=this.matched=this.match="";this.conditionStack=["INITIAL"];this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0};if(this.options.ranges){this.yylloc.range=[0,0];}this.offset=0;return this;},

			// consumes and returns one char from the input
			input:function (){var ch=this._input[0];this.yytext+=ch;this.yyleng++;this.offset++;this.match+=ch;this.matched+=ch;var lines=ch.match(/(?:\r\n?|\n).*/g);if(lines){this.yylineno++;this.yylloc.last_line++;}else{this.yylloc.last_column++;}if(this.options.ranges){this.yylloc.range[1]++;}this._input=this._input.slice(1);return ch;},

			// unshifts one char (or a string) into the input
			unput:function (ch){var len=ch.length;
				var lines=ch.split(/(?:\r\n?|\n)/g);
				this._input=ch+this._input;
				this.yytext=this.yytext.substr(0,this.yytext.length-len-1);
				this.offset-=len;
				var oldLines=this.match.split(/(?:\r\n?|\n)/g);
				this.match=this.match.substr(0,this.match.length-1);
				this.matched=this.matched.substr(0,this.matched.length-1);
				if(lines.length-1){ this.yylineno-=lines.length-1;}var r=this.yylloc.range;
				this.yylloc={
					first_line:this.yylloc.first_line,
					last_line:this.yylineno+1,
					first_column:this.yylloc.first_column,
					last_column:lines?(lines.length===oldLines.length?this.yylloc.first_column:0)+oldLines[oldLines.length-lines.length].length-lines[0].length:this.yylloc.first_column-len
				};if(this.options.ranges){this.yylloc.range=[r[0],r[0]+this.yyleng-len];
			}this.yyleng=this.yytext.length;return this;},

			// When called from action, caches matched text and appends it on next action
			more:function (){this._more=true;return this;},

			// When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
			reject:function (){if(this.options.backtrack_lexer){this._backtrack=true;}else{return this.parseError("Lexical error on line "+(this.yylineno+1)+". You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n"+this.showPosition(),{text:"",token:null,line:this.yylineno});}return this;},

			// retain first n characters of the match
			less:function (n){this.unput(this.match.slice(n));},

			// displays already matched input, i.e. for error messages
			pastInput:function (){var past=this.matched.substr(0,this.matched.length-this.match.length);return(past.length>20?"...":"")+past.substr(-20).replace(/\n/g,"");},

			// displays upcoming input, i.e. for error messages
			upcomingInput:function (){var next=this.match;if(next.length<20){next+=this._input.substr(0,20-next.length);}return(next.substr(0,20)+(next.length>20?"...":"")).replace(/\n/g,"");},

			// displays the character position where the lexing error occurred, i.e. for error messages
			showPosition:function (){
				var pre=this.pastInput();
				var c=new Array(pre.length+1).join("-");
				return pre+this.upcomingInput()+"\n"+c+"^";},

			// test the lexed token: return FALSE when not a match, otherwise return token
			test_match:function (match,indexed_rule){var token,lines,backup;if(this.options.backtrack_lexer){backup={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done};if(this.options.ranges){backup.yylloc.range=this.yylloc.range.slice(0)}}lines=match[0].match(/(?:\r\n?|\n).*/g);if(lines){this.yylineno+=lines.length}this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:lines?lines[lines.length-1].length-lines[lines.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+match[0].length};this.yytext+=match[0];this.match+=match[0];this.matches=match;this.yyleng=this.yytext.length;if(this.options.ranges){this.yylloc.range=[this.offset,this.offset+=this.yyleng]}this._more=false;this._backtrack=false;this._input=this._input.slice(match[0].length);this.matched+=match[0];token=this.performAction.call(this,this.yy,this,indexed_rule,this.conditionStack[this.conditionStack.length-1]);if(this.done&&this._input){this.done=false}if(token){if(this.options.backtrack_lexer){delete window.backup}return token}else if(this._backtrack){for(var k in backup){this[k]=backup[k]}return false}if(this.options.backtrack_lexer){delete window.backup}return false},

			// return next match in input
			next:function (){if(this.done){return this.EOF}if(!this._input){this.done=true}var token,match,tempMatch,index;if(!this._more){this.yytext="";this.match=""}var rules=this._currentRules();for(var i=0;i<rules.length;i++){tempMatch=this._input.match(this.rules[rules[i]]);if(tempMatch&&(!match||tempMatch[0].length>match[0].length)){match=tempMatch;index=i;if(this.options.backtrack_lexer){token=this.test_match(tempMatch,rules[i]);if(token!==false){return token}else if(this._backtrack){match=false;continue}else{return false}}else if(!this.options.flex){break}}}if(match){token=this.test_match(match,rules[index]);if(token!==false){return token}return false}if(this._input===""){return this.EOF}else{return this.parseError("Lexical error on line "+(this.yylineno+1)+". Unrecognized text.\n"+this.showPosition(),{text:"",token:null,line:this.yylineno})}},

			// return next match that has a token
			lex:function lex(){var r=this.next();if(r){return r}else{return this.lex()}},

			// activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
			begin:function begin(condition){this.conditionStack.push(condition)},

			// pop the previously active lexer condition state off the condition stack
			popState:function popState(){var n=this.conditionStack.length-1;if(n>0){return this.conditionStack.pop()}else{return this.conditionStack[0]}},

			// produce the lexer rule set which is active for the currently active lexer condition state
			_currentRules:function _currentRules(){if(this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]){return this.conditions[this.conditionStack[this.conditionStack.length-1]].rules}else{return this.conditions["INITIAL"].rules}},

			// return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
			topState:function topState(n){n=this.conditionStack.length-1-Math.abs(n||0);if(n>=0){return this.conditionStack[n]}else{return"INITIAL"}},

			// alias for begin(condition)
			pushState:function pushState(condition){this.begin(condition)},

			// return the number of states currently on the stack
			stateStackSize:function stateStackSize(){return this.conditionStack.length},
			options: {},
			performAction: function anonymous(yy, yy_, $avoiding_name_collisions, YY_START) {

				var YYSTATE=YY_START;
				switch($avoiding_name_collisions) {
					case 0:/* skip whitespace */
						break;
					case 1:return 16
						   break;
					case 2:return 15
						   break;
					case 3:return 12
						   break;
					case 4:return 11
						   break;
					case 5:return 10
						   break;
					case 6:return 13
						   break;
					case 7:return 14
						   break;
					case 8:return 6
						   break;
					case 9:return 7
						   break;
					case 10:return 'INVALID'
							break;
				}
			},
			rules: [/^(?:\s+)/,/^(?:[0-9]+\b)/,/^(?:[A-Za-z_][0-9A-Za-z_ '-]*\b)/,/^(?:\*)/,/^(?:\/)/,/^(?:\+)/,/^(?:\()/,/^(?:\))/,/^(?:,)/,/^(?:$)/,/^(?:.)/],
			conditions: {"INITIAL":{"rules":[0,1,2,3,4,5,6,7,8,9,10],"inclusive":true}}
			};
			return lexer;
		})();
		parser.lexer = lexer;
		function Parser () {
			this.yy = {};
		}
		Parser.prototype = parser;parser.Parser = Parser;
		return new Parser;
	})();

	pubfuncts.buildSets = function() {
		var c, i, t, n;
		pubfuncts.sets.all = {};
		for (c in setNames) {
			pubfuncts.sets[setNames[c]] = {};
		}
		for (c in setsComp) {
			t = setsComp[c];
			pubfuncts.sets[c] = {};
			pubfuncts.sets[c][c] = 1;
			pubfuncts.sets.all[c] = 1;
			for (i = 0; i < t.length; i += 1) {
				pubfuncts.sets[setNames[t[i]]][c] = 1;
			}
		}
		for (c in pubfuncts.types) {
			n = pubfuncts.canonizeName(c);
			if (setsComp.hasOwnProperty(n)) {
				t = pubfuncts.types[c].split('-');
				for (i = 0; i < t.length; i += 1) {
					if (pubfuncts.sets[t[i]] === undefined) {
						pubfuncts.sets[t[i]] = {};
					}
					pubfuncts.sets[t[i]][n] = 1;
				}
			}
		}
    };

	function myBuildCard(avail, except, set) {
		var sum = 0;
		var c;
		for (c in set) {
			if (avail[c] && !except[c]) {
				sum += set[c];
			}
		}
		if (!sum) {
			return null;
		}
		var rnd = Math.random() * sum;
		for (c in set) {
			if (avail[c] && !except[c]) {
				rnd -= set[c];
				if (rnd < 0) {
					return c;
				}
			}
		}
		return c;
	}

	pubfuncts.myBuildDeck = function(avail, s) {
		GS.debug('Entering myBuildDeck');
		var i, c;
		var chosen = {};
		var deck = new Array(11);
		for (i = 0; i < 11; i += 1) {
			if (i === 10) {
				if (!chosen.youngwitch) {
					break;
				}
				for (c in avail) {
					GS.debug("Sets:");
					GS.debug(pubfuncts.sets);
					if (!pubfuncts.sets.cost2[c] && !pubfuncts.sets.cost3[c]) {
						chosen[c] = true;
					}
				}
			}
			var cs = s[i < s.length ? i : s.length - 1];
			var card = myBuildCard(avail, chosen, cs);
			if (!card) {
				return null;
			}
			chosen[card] = true;
			deck[i] = avail[card];
		}
		return deck;
	};

	pubfuncts.qq = function(x,opts,callback,kingselector) {
		if (GS.get_option('generator') && !pubfuncts.hideKingdomGenerator
						&& (!GS.AM.hasOwnProperty('state') || GS.AM.state.game === null)
						&& opts.useEternalGenerateMethod) {
					kinggen_utils.KingdomselCode.prompt(callback);
				} else {
					callback(x);
				}
				pubfuncts.hideKingdomGenerator = false;
	};

	return pubfuncts;
}());

//second declaration allows this portion to be placed in a separate file
//html portion of form
if (typeof kinggen_utils === 'undefined') { var kinggen_utils = {}; }
kinggen_utils.KingdomselDisplay = (function() {
	"use strict";
	var pubvars = {};
	var hasNewUi = false;
	pubvars.cssclass = "newlog db-popup-container";
	pubvars.htmlstyle = "position:absolute;display:none;left:0px;top:0px;height:100%;width:100%;background:rgba(0,0,0,0.5);z-index:6000;";
	pubvars.innerHTML = function(defaultval) {
		var output = '<div class="db-popup" style="top:40%;"><div class="content" style="position:absolute; min-height: 100px;max-height:200px; top: 40%;left:15%; width: 70%;">\
						<div style="text-align:center;height:120px;margin:10px;">\
						<div style="margin-top:10px">Select a kingdom (see <a target="_blank" href="http://dom.retrobox.eu/kingdomgenerator.html">instructions</a>):</div>\
						<form id="selform" onsubmit="GS.kG.KingdomselCode.returnCards(event);">';
		if (hasNewUi) {
			output += '#\'s:';
			for (var i = 0;i<10;i++) {
				switch(i) {
				case 0:
					output += ' Base:';
					break;
				case 1:
					output += ' Int:';
					break;
				case 2:
					output += ' Sea:';
					break;
				case 3:
					output += ' Alch:';
					break;
				case 4:
					output += ' Prosp:';
					break;
				case 5:
					output += ' Corn:';
					break;
				case 6:
					output += ' Hint:';
					break;
				case 7:
					output += ' DA:';
					break;
				case 8:
					output += ' Guilds:';
					break;
				case 9:
					output += ' Promos:';
					break;
				}
				output += '<input type="number" style="width:8px" id="king_gensel' + i + '" min="0" max="10">';
			}
		}
		output += '<br />Cards: <input id="selval" name="selval" style="width:90%" value="' + defaultval + '"><br />\
		<input type="submit" name="kingselGo" class="fs-launch-game-btn" style="margin:5px;" value="OK">\
		<input type="button" name="kingselCancel" class="fs-launch-game-btn" style="margin:5px;" value="Cancel (default settings)" onClick="GS.kG.KingdomselCode.cancelCards();">\
		</form></div></div></div>';
		return output;
	};


	return pubvars;
}());
//code section of form
kinggen_utils.KingdomselCode = (function() {
	"use strict";
	var pubfuncts = {};
	var sel;
	var selform;
	var selval;
	var savedfunct;

	pubfuncts.runSetup = function(val) {
		sel = document.createElement('div');
		sel.setAttribute("style", kinggen_utils.KingdomselDisplay.htmlstyle);
		sel.setAttribute("class", kinggen_utils.KingdomselDisplay.cssclass);
		document.getElementById('viewport').appendChild(sel);
		sel.innerHTML = kinggen_utils.KingdomselDisplay.innerHTML(val);
		selform = document.getElementById('selform');
		selval = document.getElementById('selval');
	};

	pubfuncts.prompt = function(callback) {
		sel.style.display = 'block';
		selval.select();
		savedfunct = callback;
	};

	//doesn't exit on error anymore, if a user gets stuck they can hit the cancel button
	pubfuncts.returnCards = function (event) {

		var x = null;
		try {
			var all = {};
			kinggen_utils.myCachedCards.each(function (c) {all[c.get('nameId').toLowerCase()] = c.toJSON(); });

			// if blank just use all
			selval.value = selval.value === "" ? "All" : selval.value;

			var myret = kinggen_utils.myBuildDeck(all, kinggen_utils.set_parser.parse(selval.value));

			// if we got nothing, try appending All before throwing an exception
			if (!myret) {
				myret = kinggen_utils.myBuildDeck(all, kinggen_utils.set_parser.parse(selval.value + ", All"));
			}

			if (myret) {
				sel.style.display = 'none';
				x = myret;
				savedfunct(x);
			} else {
				throw new Error('Cannot generate specified kingdom from the cards availiable');
			}
		} catch (e) {
			console.error(e);
			alert('Error generating kingdom: ' + e);
		}

    // don't let the form submission reload the page
    event.stopPropagation();
    event.preventDefault();
	};

	//we've gone too far in Goko's code to pull out gracefully, but it could be possible with some rewiring
	pubfuncts.cancelCards = function() {
		sel.style.display = 'none';
		var all = {};
		kinggen_utils.myCachedCards.each(function (c) {all[c.get('nameId').toLowerCase()] = c.toJSON(); });
		savedfunct(kinggen_utils.myBuildDeck(all, kinggen_utils.set_parser.parse('All')));
	}

	return pubfuncts;
}());
//short name for this library, use at the end of the last library file
GS.kG = kinggen_utils;

(function() {
    "use strict";

    //console.log('Loading Kingdom Generator');

    GS.modules.kingdomGenerator = new GS.Module('Kingdom Generator');
    GS.modules.kingdomGenerator.dependencies =
        ['FS.Dominion.DeckBuilder.Persistent', 'FS.DominionEditTableView',
         'FS.Dominion.CardBuilder.Data.cards'];
    GS.modules.kingdomGenerator.load = function () {
        FS.DominionEditTableView.prototype._old_renderRandomDeck =
            FS.DominionEditTableView.prototype._renderRandomDeck;
        FS.DominionEditTableView.prototype._renderRandomDeck = function () {
            if (this.ratingType === 'pro') {
                GS.kG.hideKingdomGenerator = true;
            }
            this._old_renderRandomDeck();
		};

		GS.kG.buildSets();

		//could save settings and replace 'all' with the saved setting
		GS.kG.KingdomselCode.runSetup('All');

		// FS.Dominion.Deckbuilder.Persistent.prototype is declared as = p in FS.DeckBuilder.js

		//if we've already overwritten the functions, don't do it twice
		if (FS.Dominion.DeckBuilder.Persistent.prototype._old_proRandomMethod) {
			return;
		}

		//cache the old method of generating a pro set
		FS.Dominion.DeckBuilder.Persistent.prototype._old_proRandomMethod =
		FS.Dominion.DeckBuilder.Persistent.prototype._proRandomMethod;

		FS.Dominion.DeckBuilder.Persistent.prototype._proRandomMethod = function (cachedCards, exceptCards, numberCards) {
			//potentially override default card set??
			GS.kG.myCachedCards = cachedCards;
			var ret = this._old_proRandomMethod(cachedCards, exceptCards, numberCards);
			return ret;
		};

		//cache old method of generating a set
		FS.Dominion.DeckBuilder.Persistent.prototype._old_getRandomCards =
		FS.Dominion.DeckBuilder.Persistent.prototype.getRandomCards;

		FS.Dominion.DeckBuilder.Persistent.prototype.getRandomCards = function (opts, callback) {
			this._old_getRandomCards(opts, function (x) {
				GS.kG.qq(x,opts,callback);
			});
		};
	};
}());
