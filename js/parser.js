/*

Primary author: Stephen Lavelle (www.increpare.com)
Contributor: Curtis Bechtel

Licence: MIT

Repository: github.com/crb233/PuzzleScript
    (forked from github.com/increpare/PuzzleScript)

Testers:
    none, yet

code used

colors used
color values for named colours from arne, mostly (and a couple from a 32-colour palette attributed to him)
http://androidarts.com/palette/16pal.htm

The editor is a slight modification of codemirror (codemirror.net), which is crazy awesome.

For more information on the custom codemirror mode (defined as codeMirrorFn):
http://codemirror.net/doc/manual.html#modeapi

*/

var compiling = false;
var errorStrings = [];
var errorCount = 0;





/*
 * Console loggind methods for the parser
 */

// logs an error message to the console
function logErrorCacheable(str, lineNumber, urgent) {
    if (compiling || urgent) {
        if (lineNumber === undefined) {
            return logErrorNoLine(str);
        }
        var errorString = '<a onclick="jumpToLine(' + lineNumber.toString() + ');"  href="javascript:void(0);"><span class="errorTextLineNumber"> line ' + lineNumber.toString() + '</span></a> : ' + '<span class="errorText">' + str + '</span>';
        if (errorStrings.indexOf(errorString) >= 0 && !urgent) {
            //do nothing, duplicate error
        } else {
            consolePrint(errorString);
            errorStrings.push(errorString);
            errorCount++;
        }
    }
}

// logs an error message to the console
function logError(str, lineNumber, urgent) {
    if (compiling || urgent) {
        if (lineNumber === undefined) {
            return logErrorNoLine(str);
        }
        var errorString = '<a onclick="jumpToLine(' + lineNumber.toString() + ');"  href="javascript:void(0);"><span class="errorTextLineNumber"> line ' + lineNumber.toString() + '</span></a> : ' + '<span class="errorText">' + str + '</span>';
        if (errorStrings.indexOf(errorString) >= 0 && !urgent) {
            //do nothing, duplicate error
        } else {
            consolePrint(errorString,true);
            errorStrings.push(errorString);
            errorCount++;
        }
    }
}

// logs a warning message to the console
function logWarning(str, lineNumber, urgent) {
    if (compiling || urgent) {
        if (lineNumber === undefined) {
            return logErrorNoLine(str);
        }
        var errorString = '<a onclick="jumpToLine(' + lineNumber.toString() + ');"  href="javascript:void(0);"><span class="errorTextLineNumber"> line ' + lineNumber.toString() + '</span></a> : ' + '<span class="warningText">' + str + '</span>';
        if (errorStrings.indexOf(errorString) >= 0 && !urgent) {
            //do nothing, duplicate error
        } else {
            consolePrint(errorString,true);
            errorStrings.push(errorString);
        }
    }
}

// logs an error message to the console without a line number
function logErrorNoLine(str, urgent) {
    if (compiling || urgent) {
        var errorString = '<span class="errorText">' + str + '</span>';
        if (errorStrings.indexOf(errorString) >= 0 && !urgent) {
            //do nothing, duplicate error
        } else {
            consolePrint(errorString,true);
            errorStrings.push(errorString);
        }
        errorCount++;
    }
}

// logs a 'beta' message to the console
// unused?
function logBetaMessage(str, urgent){
    if (compiling || urgent) {
        var errorString = '<span class="betaText">' + str + '</span>';
        if (errorStrings.indexOf(errorString) >= 0 && !urgent) {
            //do nothing, duplicate error
        } else {
            consoleError(errorString);
            errorStrings.push(errorString);
        }
    }
}





/*
 * Parsing methds and variables
 */

// constant variables used for parsing
var sectionNames = ['objects', 'legend', 'sounds', 'collisionlayers', 'rules', 'winconditions', 'levels'];
var commandwords = ["sfx0","sfx1","sfx2","sfx3","sfx4","sfx5","sfx6","sfx7","sfx8","sfx9","sfx10","cancel","checkpoint","restart","win","message","again"];
var reg_name = /[\w]+\s*/;///\w*[a-uw-zA-UW-Z0-9_]/;
var reg_soundseed = /\d+\b/;
var reg_sectionNames = /(objects|collisionlayers|legend|sounds|rules|winconditions|levels)\s*/;
var reg_equalsrow = /[\=]+/;
var reg_notcommentstart = /[^\(]+/;
var reg_csv_separators = /[ \,]*/;
var reg_soundverbs = /(move|action|create|destroy|cantmove|undo|restart|titlescreen|startgame|cancel|endgame|startlevel|endlevel|showmessage|closemessage|sfx0|sfx1|sfx2|sfx3|sfx4|sfx5|sfx6|sfx7|sfx8|sfx9|sfx10)\s+/;
var reg_directions = /^(action|up|down|left|right|\^|v|\<|\>|forward|moving|stationary|parallel|perpendicular|horizontal|orthogonal|vertical|no|randomdir|random)$/;
var reg_loopmarker = /^(startloop|endloop)$/;
var reg_ruledirectionindicators = /^(up|down|left|right|horizontal|vertical|orthogonal|late|rigid)$/;
var reg_sounddirectionindicators = /\s*(up|down|left|right|horizontal|vertical|orthogonal)\s*/;
var reg_winconditionquantifiers = /^(all|any|no|some)$/;
var keyword_array = ['checkpoint','objects', 'collisionlayers', 'legend', 'sounds', 'rules', '...','winconditions', 'levels','|','[',']','up', 'down', 'left', 'right', 'late','rigid', '^','v','\>','\<','no','randomdir','random', 'horizontal', 'vertical','any', 'all', 'no', 'some', 'moving','stationary','parallel','perpendicular','action','message'];

// var absolutedirs = ['up', 'down', 'right', 'left'];
// var relativedirs = ['^', 'v', '<', '>', 'moving','stationary','parallel','perpendicular', 'no'];
// var logicWords = ['all', 'no', 'on', 'some'];
// var reg_commands = /\s*(sfx0|sfx1|sfx2|sfx3|Sfx4|sfx5|sfx6|sfx7|sfx8|sfx9|sfx10|cancel|checkpoint|restart|win|message|again)\s*/;
// var reg_number = /[\d]+/;
// var reg_spriterow = /[\.0-9]{5}\s*/;
// var reg_keywords = /(checkpoint|objects|collisionlayers|legend|sounds|rules|winconditions|\.\.\.|levels|up|down|left|right|^|\||\[|\]|v|\>|\<|no|horizontal|orthogonal|vertical|any|all|no|some|moving|stationary|parallel|perpendicular|action)/;
// var fullSpriteMatrix = [
//     '00000',
//     '00000',
//     '00000',
//     '00000',
//     '00000'
// ];


// This function returns an object containing methods needed to parse
// PuzzleScript source code
function codeMirrorFn() {
    'use strict';
    
    return {
        copyState: copyStateFunction,
        blankLine: blankLineFunction,
        token: tokenFunction,
        
        startState: function() {
            return {
                // permanently useful
                objects: {},
                sprite_size: 5,
                
                // just for parsing
                lineNumber: 0,
                commentLevel: 0,
                section: '',
                visitedSections: [],
                
                objects_candname: '',
                objects_section: 0, // whether reading name/color/spritematrix
                objects_spritematrix: [],
                
                collisionLayers: [],
                tokenIndex: 0,
                
                legend_synonyms: [],
                legend_aggregates: [],
                legend_properties: [],
                
                sounds: [],
                rules: [],
                names: [],
                winconditions: [],
                metadata: [],
                abbrevNames: [],
                levels: [[]],
                subsection: ''
            };
        }
    };
}

// copies a state object
function copyStateFunction(state) {
    var objectsCopy = {};
    for (var i in state.objects) {
        if (state.objects.hasOwnProperty(i)) {
            var o = state.objects[i];
            objectsCopy[i] = {
                colors: o.colors.concat([]),
                lineNumber : o.lineNumber,
                spritematrix: o.spritematrix.concat([])
            }
        }
    }
    
    var collisionLayersCopy = [];
    for (var i = 0; i < state.collisionLayers.length; i++) {
        collisionLayersCopy.push(state.collisionLayers[i].concat([]));
    }
    
    var legend_synonymsCopy = [];
    var legend_aggregatesCopy = [];
    var legend_propertiesCopy = [];
    var soundsCopy = [];
    var levelsCopy = [];
    var winConditionsCopy = [];
    
    for (var i = 0; i < state.legend_synonyms.length; i++) {
        legend_synonymsCopy.push(state.legend_synonyms[i].concat([]));
    }
    
    for (var i = 0; i < state.legend_aggregates.length; i++) {
        legend_aggregatesCopy.push(state.legend_aggregates[i].concat([]));
    }
    
    for (var i = 0; i < state.legend_properties.length; i++) {
        legend_propertiesCopy.push(state.legend_properties[i].concat([]));
    }
    
    for (var i = 0; i < state.sounds.length; i++) {
        soundsCopy.push(state.sounds[i].concat([]));
    }
    
    for (var i = 0; i < state.levels.length; i++) {
        levelsCopy.push(state.levels[i].concat([]));
    }
    
    for (var i = 0; i < state.winconditions.length; i++) {
        winConditionsCopy.push(state.winconditions[i].concat([]));
    }
    
    var nstate = {
        lineNumber: state.lineNumber,
        
        objects: objectsCopy,
        collisionLayers: collisionLayersCopy,
        
        commentLevel: state.commentLevel,
        section: state.section,
        visitedSections: state.visitedSections.concat([]),
        
        objects_candname: state.objects_candname,
        objects_section: state.objects_section,
        objects_spritematrix: state.objects_spritematrix.concat([]),
        
        tokenIndex: state.tokenIndex,
        legend_synonyms: legend_synonymsCopy,
        legend_aggregates: legend_aggregatesCopy,
        legend_properties: legend_propertiesCopy,
        
        sounds: soundsCopy,
        rules: state.rules.concat([]),
        names: state.names.concat([]),
        winconditions: winConditionsCopy,
        abbrevNames: state.abbrevNames.concat([]),
        metadata : state.metadata.concat([]),
        levels: levelsCopy,
        
        STRIDE_OBJ : state.STRIDE_OBJ,
        STRIDE_MOV : state.STRIDE_MOV
    };
    
    return nstate;
}

// called when a blank line appears during parsing
// is this used anywhere?
function blankLineFunction(state) {
    if (state.section === 'levels') {
        if (state.levels[state.levels.length - 1].length > 0) {
            state.levels.push([]);
        }
    }
}

// handle the occurrance of a blank line during parsing
// why is it defined separately from the above? I have no idea
function blankLineHandle(state) {
    if (state.section === 'levels') {
        if (state.levels[state.levels.length - 1].length > 0) {
            state.levels.push([]);
        }
    } else if (state.section === 'objects') {
        state.objects_section = 0;
    }
}

// finds the index of a string in an array
// if not found, returns -1
// but why not just use .indexOf() ?
function searchStringInArray(str, strArray) {
    for (var j = 0; j < strArray.length; j++) {
        if (strArray[j] === str) { return j; }
    }
    return -1;
}

// unused in this file
function isMatrixLine(str) {
    for (var j = 0; j < str.length; j++) {
        if (str.charAt(j) !== '.' && str.charAt(j) !== '0') {
            return false;
        }
    }
    return true;
}

// checks that an object's name is new and hasn't already been defined
function checkNameNew(state, candname) {
    if (state.objects[candname] !== undefined) {
        logError('Object "' + candname.toUpperCase() + '" defined multiple times.', state.lineNumber);
        return 'ERROR';
    }
    for (var i = 0; i < state.legend_synonyms.length;i++) {
        var entry = state.legend_synonyms[i];
        if (entry[0] == candname) {
            logError('Name "' + candname.toUpperCase() + '" already in use.', state.lineNumber);
        }
    }
    for (var i = 0; i < state.legend_aggregates.length;i++) {
        var entry = state.legend_aggregates[i];
        if (entry[0] == candname) {
            logError('Name "' + candname.toUpperCase() + '" already in use.', state.lineNumber);
        }
    }
    for (var i = 0; i < state.legend_properties.length;i++) {
        var entry = state.legend_properties[i];
        if (entry[0] == candname) {
            logError('Name "' + candname.toUpperCase() + '" already in use.', state.lineNumber);
        }
    }
}

// parses the given data stream into tokens
function tokenFunction(stream, state) {
    // stores the state of the current line (temporary data only)
    var temp = {};
    
    // original string for this line
    temp.mixedCase = stream.string;
    
    // start of line?
    temp.sol = stream.sol();
    
    if (temp.sol) {
        stream.string = stream.string.toLowerCase();
        state.tokenIndex=0;
    }
    
    stream.eatWhile(/[ \t]/);
    
    //////////////////////////////
    // COMMENT PROCESSING BEGIN //
    //////////////////////////////
    
    // NESTED COMMENTS
    var ch = stream.peek();
    temp.ch = ch;
    
    // begin comment, not in a message command
    // (tokenIndex of -4 indicates message command)
    if (ch === '(' && state.tokenIndex !== -4) {
        stream.next();
        state.commentLevel++;
        
    // end comment
    } else if (ch === ')') {
        stream.next();
        if (state.commentLevel > 0) {
            state.commentLevel--;
            if (state.commentLevel === 0) {
                return 'comment';
            }
        } else {
            logWarning('Extra closing parenthesis', state.lineNumber, true);
        }
    }
    
    // comsume the rest of the comment, making sure to consider nested comments
    if (state.commentLevel > 0) {
        while (true) {
            stream.eatWhile(/[^\(\)]+/);
            
            if (stream.eol()) {
                break;
            }
            
            ch = stream.peek();
            
            if (ch === '(') {
                state.commentLevel++;
            } else if (ch === ')') {
                state.commentLevel--;
            }
            stream.next();
            
            if (state.commentLevel === 0) {
                break;
            }
        }
        return 'comment';
    }
    
    // consume white space (spaces and tabs, not newlines)
    stream.eatWhile(/[ \t]/);
    
    // initially at the start of the line, now we're at the end
    // this was a blank line
    if (temp.sol && stream.eol()) {
        return blankLineHandle(state);
    }
    
    /* if (temp.sol) { */
    
    // matches the '===' right before a new section
    if (temp.sol && stream.match(reg_equalsrow, true)) {
        return 'EQUALSBIT';
    }
    
    // if at the start of a new section (matches the section name)
    if (stream.match(reg_sectionNames, true)) {
        state.section = stream.string.slice(0, stream.pos).trim();
        if (state.visitedSections.indexOf(state.section) >= 0) {
            logError('cannot duplicate sections (you tried to duplicate \"' + state.section.toUpperCase() + '").', state.lineNumber);
        }
        
        // make sure the sections are being traversed in the correct order
        state.visitedSections.push(state.section);
        var sectionIndex = sectionNames.indexOf(state.section);
        
        // if section name isn't valid
        if (sectionIndex === -1) {
            logError('no such section as "' + state.section.toUpperCase() + '".', state.lineNumber);
            
        // if this is the first section
        } else if (sectionIndex === 0) {
            state.objects_section = 0;
            if (state.visitedSections.length > 1) {
                logError('section "' + state.section.toUpperCase() + '" must be the first section', state.lineNumber);
            }
            
        // if the previous section hasn't been visited yet
        } else if (state.visitedSections.indexOf(sectionNames[sectionIndex - 1]) === -1) {
            logError('section "' + state.section.toUpperCase() + '" is out of order, must follow  "' + sectionNames[sectionIndex - 1].toUpperCase() + '".', state.lineNumber);
        }
        
        // if in sounds section, push all object/synonym/aggregate/property
        // names to the state.names array
        if (state.section === 'sounds') {
            
            // populate names from objects
            for (var n in state.objects) {
                if (state.objects.hasOwnProperty(n)) {
                    /*
                    if (state.names.indexOf(n)!==-1) {
                        logError('Object "'+n+'" has been declared to be multiple different things',state.objects[n].lineNumber);
                    }
                    */
                    state.names.push(n);
                }
            }
            
            // populate names from legend synonyms (A = B)
            for (var i = 0; i < state.legend_synonyms.length; i++) {
                var n = state.legend_synonyms[i][0];
                /*
                if (state.names.indexOf(n)!==-1) {
                    logError('Object "'+n+'" has been declared to be multiple different things',state.legend_synonyms[i].lineNumber);
                }
                */
                state.names.push(n);
            }
            
            // populate names from legend aggregates (A = B and C)
            for (var i = 0; i < state.legend_aggregates.length; i++) {
                var n = state.legend_aggregates[i][0];
                /*
                if (state.names.indexOf(n)!==-1) {
                    logError('Object "'+n+'" has been declared to be multiple different things',state.legend_aggregates[i].lineNumber);
                }
                */
                state.names.push(n);
            }
            
            // populate names from legend properties (A = B or C)
            for (var i = 0; i < state.legend_properties.length; i++) {
                var n = state.legend_properties[i][0];
                /*
                if (state.names.indexOf(n)!==-1) {
                    logError('Object "'+n+'" has been declared to be multiple different things',state.legend_properties[i].lineNumber);
                }
                */
                state.names.push(n);
            }
            
        // if in levels section, push all character abbreviations for
        // objects to the state.abbrevNames array
        } else if (state.section === 'levels') {
            
            // populate character abbreviations
            for (var n in state.objects) {
                if (state.objects.hasOwnProperty(n) && n.length == 1) {
                    state.abbrevNames.push(n);
                }
            }
            
            for (var i = 0; i < state.legend_synonyms.length; i++) {
                if (state.legend_synonyms[i][0].length == 1) {
                    state.abbrevNames.push(state.legend_synonyms[i][0]);
                }
            }
            
            for (var i = 0; i < state.legend_aggregates.length; i++) {
                if (state.legend_aggregates[i][0].length == 1) {
                    state.abbrevNames.push(state.legend_aggregates[i][0]);
                }
            }
        }
        
        return 'HEADER';
        
    // we haven't entered a new section
    } else {
        if (state.section === undefined) {
            logError('must start with section "OBJECTS"', state.lineNumber);
        }
    }
    
    // already at the end of the line
    if (stream.eol()) {
        return null;
    }
    
    // use the method for parsing the current section
    switch (state.section) {
        case 'objects':
            return objectsParser(stream, state, temp);
            
        case 'sounds':
            return soundsParser(stream, state, temp);
            
        case 'collisionlayers':
            return collisionLayersParser(stream, state, temp);
            
        case 'legend':
            return legendParser(stream, state, temp);
            
        case 'rules':
            return rulesParser(stream, state, temp);
            
        case 'winconditions':
            return winConditionsParser(stream, state, temp);
            
        case 'levels':
            return levelsParser(stream, state, temp);
            
        default:
            return preambleParser(stream, state, temp);
    }
    
    /* } */
    
    if (stream.eol()) {
        return null;
    }
    
    if (!stream.eol()) {
        stream.next();
        return null;
    }
}

function objectsParser(stream, state, temp) {
    var tryParseName = function() {
        // LOOK FOR NAME
        var match_name = temp.sol ? stream.match(reg_name, true) : stream.match(/[^\s\()]+\s*/, true);
        if (match_name == null) {
            stream.match(reg_notcommentstart, true);
            if (stream.pos > 0){
                logWarning('Unknown junk in object section (possibly: sprites have to be 5 pixels wide and 5 pixels high exactly. Or maybe: the main names for objects have to be words containing only the letters a-z0.9 - if you want to call them something like ",", do it in the legend section).',state.lineNumber);
            }
            return 'ERROR';
        } else {
            var candname = match_name[0].trim();
            if (state.objects[candname] !== undefined) {
                logError('Object "' + candname.toUpperCase() + '" defined multiple times.', state.lineNumber);
                return 'ERROR';
            }
            for (var i = 0; i < state.legend_synonyms.length; i++) {
                var entry = state.legend_synonyms[i];
                if (entry[0] == candname) {
                    logError('Name "' + candname.toUpperCase() + '" already in use.', state.lineNumber);
                }
            }
            if (keyword_array.indexOf(candname) >= 0) {
                logWarning('You named an object "' + candname.toUpperCase() + '", but this is a keyword. Don\'t do that!', state.lineNumber);
            }
            
            if (temp.sol) {
                state.objects_candname = candname;
                state.objects[state.objects_candname] = {
                    lineNumber: state.lineNumber,
                    colors: [],
                    spritematrix: []
                };
            } else {
                //set up alias
                var synonym = [candname,state.objects_candname];
                synonym.lineNumber = state.lineNumber;
                state.legend_synonyms.push(synonym);
            }
            state.objects_section = 1;
            return 'NAME';
        }
    };
    
    if (temp.sol && state.objects_section == 2) {
        state.objects_section = 3;
    }
    
    if (temp.sol && state.objects_section == 1) {
        state.objects_section = 2;
    }
    
    // which part of an object definition are we reading?
    switch (state.objects_section) {
        // read the object's name (and possibly symbol?)
        case 0:
        case 1: {
            state.objects_spritematrix = [];
            return tryParseName();
            break;
        }
        
        // read the object's color palette
        case 2: {
            state.tokenIndex = 0;
            var match_color = stream.match(reg_color, true);
            if (match_color == null) {
                var str = stream.match(reg_name, true) || stream.match(reg_notcommentstart, true);
                logError('Was looking for color for object ' + state.objects_candname.toUpperCase() + ', got "' + str + '" instead.', state.lineNumber);
                return null;
            } else {
                if (state.objects[state.objects_candname].colors === undefined) {
                    state.objects[state.objects_candname].colors = [match_color[0].trim()];
                } else {
                    state.objects[state.objects_candname].colors.push(match_color[0].trim());
                }
                
                var candcol = match_color[0].trim().toLowerCase();
                if (candcol in colorPalettes.arnecolors) {
                    return 'COLOR COLOR-' + candcol.toUpperCase();
                } else if (candcol==="transparent") {
                    return 'COLOR FADECOLOR';
                } else {
                    return 'COLOR';
                }
            }
            break;
        }
        
        // read the object's sprite matrix
        case 3: {
            var ch = stream.eat(/[.\d]/);
            var spritematrix = state.objects_spritematrix;
            if (ch === undefined) {
                if (spritematrix.length === 0) {
                    return tryParseName();
                }
                logError('Unknown junk in spritematrix for object ' + state.objects_candname.toUpperCase() + '.', state.lineNumber);
                stream.match(reg_notcommentstart, true);
                return null;
            }
            
            if (temp.sol) {
                spritematrix.push('');
            }
            
            var o = state.objects[state.objects_candname];
            
            spritematrix[spritematrix.length - 1] += ch;
            if (spritematrix[spritematrix.length-1].length>5){
                logError('Sprites must be 5 wide and 5 high.', state.lineNumber);
                stream.match(reg_notcommentstart, true);
                return null;
            }
            o.spritematrix = state.objects_spritematrix;
            if (spritematrix.length === 5 && spritematrix[spritematrix.length - 1].length == 5) {
                state.objects_section = 0;
            }
            
            if (ch !== '.') {
                var n = parseInt(ch);
                if (n>=o.colors.length) {
                    logError("Trying to access color number "+n+" from the color palette of sprite " +state.objects_candname.toUpperCase()+", but there are only "+o.colors.length+" defined in it.",state.lineNumber);
                    return 'ERROR';
                }
                if (isNaN(n)) {
                    logError('Invalid character "' + ch + '" in sprite for ' + state.objects_candname.toUpperCase(), state.lineNumber);
                    return 'ERROR';
                }
                return 'COLOR BOLDCOLOR COLOR-' + o.colors[n].toUpperCase();
            }
            return 'COLOR FADECOLOR';
        }
        default: {
            window.console.logError("EEK shouldn't get here.");
        }
    }
}

function soundsParser(stream, state, temp) {
    if (temp.sol) {
        var ok = true;
        var splits = reg_notcommentstart.exec(stream.string)[0].split(/\s/).filter(function(v) {return v !== ''});
        splits.push(state.lineNumber);
        state.sounds.push(splits);
    }
    
    var candname = stream.match(reg_soundverbs, true);
    if (candname !== null) {
        return 'SOUNDVERB';
    }
    
    candname = stream.match(reg_sounddirectionindicators, true);
    if (candname !== null) {
        return 'DIRECTION';
    }
    
    candname = stream.match(reg_soundseed, true);
    if (candname !== null) {
        state.tokenIndex++;
        return 'SOUND';
    }
    
    candname = stream.match(/[^\[\|\]\s]*/, true);
    if (candname !== null ) {
        var m = candname[0].trim();
        if (state.names.indexOf(m) >= 0) {
            return 'NAME';
        }
    }
    
    candname = stream.match(reg_notcommentstart, true);
    logError('unexpected sound token "' + candname + '".', state.lineNumber);
    stream.match(reg_notcommentstart, true);
    return 'ERROR';
}

function collisionLayersParser(stream, state, temp) {
    if (temp.sol) {
        //create new collision layer
        state.collisionLayers.push([]);
        state.tokenIndex=0;
    }
    
    var match_name = stream.match(reg_name, true);
    if (match_name === null) {
        //then strip spaces and commas
        var prepos = stream.pos;
        stream.match(reg_csv_separators, true);
        if (stream.pos == prepos) {
            logError("error detected - unexpected character " + stream.peek(), state.lineNumber);
            stream.next();
        }
        return null;
    } else {
        //have a name: let's see if it's valid
        var candname = match_name[0].trim();
        
        var substitutor = function(n) {
            n = n.toLowerCase();
            if (n in state.objects) {
                return [n];
            }
            
            
            for (var i = 0; i < state.legend_synonyms.length; i++) {
                var a = state.legend_synonyms[i];
                if (a[0] === n) {
                    return [a[1]];
                }
            }
            
            for (var i = 0; i < state.legend_aggregates.length; i++) {
                var a = state.legend_aggregates[i];
                if (a[0] === n) {
                    logError('"' + n + '" is an aggregate (defined using "and"), and cannot be added to a single layer because its constituent objects must be able to coexist.', state.lineNumber);
                    return [];
                }
            }
            
            for (var i = 0; i < state.legend_properties.length; i++) {
                var a = state.legend_properties[i];
                if (a[0] === n) {
                    var result = [].concat.apply([],a.slice(1).map(substitutor));
                    return result;
                }
            }
            
            logError('Cannot add "' + candname.toUpperCase() + '" to a collision layer; it has not been declared.', state.lineNumber);
            return [];
        };
        if (candname === 'background') {
            if (state.collisionLayers.length > 0 && state.collisionLayers[state.collisionLayers.length - 1].length > 0) {
                logError("Background must be in a layer by itself.", state.lineNumber);
            }
            state.tokenIndex = 1;
        } else if (state.tokenIndex !== 0) {
            logError("Background must be in a layer by itself.", state.lineNumber);
        }
        
        var ar = substitutor(candname);
        
        if (state.collisionLayers.length === 0) {
            logError("no layers found.",state.lineNumber);
            return 'ERROR';
        }
        
        var foundOthers = [];
        for (var i = 0; i < ar.length; i++){
            var candname = ar[i];
            for (var j = 0; j <= state.collisionLayers.length - 1; j++){
                var clj = state.collisionLayers[j];
                if (clj.indexOf(candname) >= 0){
                    foundOthers.push(j);
                }
            }
        }
        if (foundOthers.length > 0){
            var warningStr = 'Object "' + candname.toUpperCase() + '" included in multiple collision layers ( layers ';
            for (var i = 0; i < foundOthers.length; i++){
                warningStr += foundOthers[i] + ", ";
            }
            warningStr += state.collisionLayers.length - 1;
            logWarning(warningStr + '). You should fix this!', state.lineNumber);
        }
        
        state.collisionLayers[state.collisionLayers.length - 1] = state.collisionLayers[state.collisionLayers.length - 1].concat(ar);
        if (ar.length > 0) {
            return 'NAME';
        } else {
            return 'ERROR';
        }
    }
}

function legendParser(stream, state, temp) {
    if (temp.sol) {
        
        //step 1 : verify format
        var longer = stream.string.replace('=', ' = ');
        longer = reg_notcommentstart.exec(longer)[0];
        
        var splits = longer.split(/\s/).filter(function(v) {
            return v !== '';
        });
        var ok = true;
        
        if (splits.length > 0) {
            var candname = splits[0].toLowerCase();
            if (keyword_array.indexOf(candname) >= 0) {
                logWarning('You named an object "' + candname.toUpperCase() + '", but this is a keyword. Don\'t do that!', state.lineNumber);
            }
            if (splits.indexOf(candname, 2) >= 2) {
                logError("You can't define object " + candname.toUpperCase() + " in terms of itself!", state.lineNumber);
            }
            checkNameNew(state,candname);
        }
        
        if (splits.length < 3) {
            ok = false;
        } else if (splits[1] !== '=') {
            ok = false;
        } else if (splits.length === 3) {
            var synonym = [splits[0], splits[2].toLowerCase()];
            synonym.lineNumber = state.lineNumber;
            state.legend_synonyms.push(synonym);
        } else if (splits.length % 2 === 0) {
            ok = false;
        } else {
            var lowertoken = splits[3].toLowerCase();
            if (lowertoken === 'and') {
                
                var substitutor = function(n) {
                    n = n.toLowerCase();
                    if (n in state.objects) {
                        return [n];
                    }
                    for (var i = 0; i < state.legend_synonyms.length; i++) {
                        var a = state.legend_synonyms[i];
                        if (a[0] === n) {
                            return [1];
                        }
                    }
                    for (var i = 0; i < state.legend_aggregates.length; i++) {
                        var a = state.legend_aggregates[i];
                        if (a[0] === n) {
                            return [].concat.apply([],a.slice(1).map(substitutor));
                        }
                    }
                    for (var i = 0; i < state.legend_properties.length; i++) {
                        var a = state.legend_properties[i];
                        if (a[0] === n) {
                            logError("Cannot define an aggregate (using 'and') in terms of properties (something that uses 'or').", state.lineNumber);
                            ok = false;
                            return [n];
                        }
                    }
                    return [n];
                };
                
                for (var i = 5; i < splits.length; i += 2) {
                    if (splits[i].toLowerCase() !== 'and') {
                        ok = false;
                        break;
                    }
                }
                if (ok) {
                    var newlegend = [splits[0]].concat(substitutor(splits[2])).concat(substitutor(splits[4]));
                    for (var i = 6; i < splits.length; i += 2) {
                        newlegend = newlegend.concat(substitutor(splits[i]));
                    }
                    newlegend.lineNumber = state.lineNumber;
                    state.legend_aggregates.push(newlegend);
                }
            } else if (lowertoken === 'or') {
                
                var substitutor = function(n) {
                    n = n.toLowerCase();
                    if (n in state.objects) {
                        return [n];
                    }
                    
                    for (var i = 0; i < state.legend_synonyms.length; i++) {
                        var a = state.legend_synonyms[i];
                        if (a[0] === n) {
                            return [1];
                        }
                    }
                    for (var i = 0; i < state.legend_aggregates.length; i++) {
                        var a = state.legend_aggregates[i];
                        if (a[0] === n) {
                            logError("Cannot define a property (using 'or') in terms of aggregates (something that uses 'and').", state.lineNumber);
                            ok = false;
                        }
                    }
                    for (var i = 0; i < state.legend_properties.length; i++) {
                        var a = state.legend_properties[i];
                        if (a[0] === n) {
                            return [].concat.apply([], a.slice(1).map(substitutor));
                        }
                    }
                    return [n];
                };
                
                for (var i = 5; i < splits.length; i += 2) {
                    if (splits[i].toLowerCase() !== 'or') {
                        ok = false;
                        break;
                    }
                }
                if (ok) {
                    var newlegend = [splits[0], splits[2].toLowerCase(), splits[4].toLowerCase()];
                    for (var i = 6; i < splits.length; i += 2) {
                        newlegend.push(splits[i].toLowerCase());
                    }
                    newlegend.lineNumber = state.lineNumber;
                    state.legend_properties.push(newlegend);
                }
            } else {
                ok = false;
            }
        }
        
        if (ok === false) {
            logError('incorrect format of legend - should be one of A = B, A = B or C ( or D ...), A = B and C (and D ...)', state.lineNumber);
            stream.match(reg_notcommentstart, true);
            return 'ERROR';
        }
        
        state.tokenIndex = 0;
    }
    
    if (state.tokenIndex === 0) {
        stream.match(/[^=]*/, true);
        state.tokenIndex++;
        return 'NAME';
    } else if (state.tokenIndex === 1) {
        stream.next();
        stream.match(/\s*/, true);
        state.tokenIndex++;
        return 'ASSSIGNMENT';
    } else {
        var match_name = stream.match(reg_name, true);
        if (match_name === null) {
            logError("Something bad's happening in the LEGEND", state.lineNumber);
            stream.match(reg_notcommentstart, true);
            return 'ERROR';
        } else {
            var candname = match_name[0].trim();
            
            if (state.tokenIndex % 2 === 0) {
                
                var wordExists = function(n) {
                    n = n.toLowerCase();
                    if (n in state.objects) {
                        return true;
                    }
                    for (var i = 0; i < state.legend_aggregates.length; i++) {
                        var a = state.legend_aggregates[i];
                        if (a[0] === n) {
                            return true;
                        }
                    }
                    for (var i = 0; i < state.legend_properties.length; i++) {
                        var a = state.legend_properties[i];
                        if (a[0] === n) {
                            return true;
                        }
                    }
                    for (var i = 0; i < state.legend_synonyms.length; i++) {
                        var a = state.legend_synonyms[i];
                        if (a[0] === n) {
                            return true;
                        }
                    }
                    return false;
                };
                
                
                if (wordExists(candname) === false) {
                    logError('Cannot reference "' + candname.toUpperCase() + '" in the LEGEND section; it has not been defined yet.', state.lineNumber);
                    state.tokenIndex++;
                    return 'ERROR';
                } else {
                    state.tokenIndex++;
                    return 'NAME';
                }
            } else {
                state.tokenIndex++;
                return 'LOGICWORD';
            }
        }
    }
}

function rulesParser(stream, state, temp) {
    if (temp.sol) {
        var rule = reg_notcommentstart.exec(stream.string)[0];
        state.rules.push([rule, state.lineNumber, temp.mixedCase]);
        state.tokenIndex = 0;//in rules, records whether bracket has been found or not
    }
    
    if (state.tokenIndex === -4) {
        stream.skipToEnd();
        return 'MESSAGE';
    }
    if (stream.match(/\s*\-\>\s*/, true)) {
        return 'ARROW';
    }
    if (temp.ch === '[' || temp.ch === '|' || temp.ch === ']' || temp.ch==='+') {
        if (temp.ch !== '+') {
            state.tokenIndex = 1;
        }
        stream.next();
        stream.match(/\s*/, true);
        return 'BRACKET';
    } else {
        var m = stream.match(/[^\[\|\]\s]*/, true)[0].trim();
        
        if (state.tokenIndex === 0 && reg_loopmarker.exec(m)) {
            return 'BRACKET';
        } else if (state.tokenIndex === 0 && reg_ruledirectionindicators.exec(m)) {
            stream.match(/\s*/, true);
            return 'DIRECTION';
        } else if (state.tokenIndex === 1 && reg_directions.exec(m)) {
            stream.match(/\s*/, true);
            return 'DIRECTION';
        } else {
            if (state.names.indexOf(m) >= 0) {
                if (temp.sol) {
                    logError('Identifiers cannot appear outside of square brackes in rules, only directions can.', state.lineNumber);
                    return 'ERROR';
                } else {
                    stream.match(/\s*/, true);
                    return 'NAME';
                }
            } else if (m === '...') {
                return 'DIRECTION';
            } else if (m === 'rigid') {
                return 'DIRECTION';
            } else if (m === 'random') {
                return 'DIRECTION';
            } else if (commandwords.indexOf(m) >= 0) {
                if (m === 'message') {
                    state.tokenIndex = -4;
                }
                return 'COMMAND';
            } else {
                logError('Name "' + m + '", referred to in a rule, does not exist.', state.lineNumber);
                return 'ERROR';
            }
        }
    }
}

function winConditionsParser(stream, state, temp) {
    if (temp.sol) {
        var tokenized = reg_notcommentstart.exec(stream.string);
        var splitted = tokenized[0].split(/\s/);
        var filtered = splitted.filter(function(v) {return v !== ''});
        filtered.push(state.lineNumber);
        
        state.winconditions.push(filtered);
        state.tokenIndex = -1;
    }
    state.tokenIndex++;
    var match = stream.match(/\s*\w+\s*/);
    if (match === null) {
        logError('incorrect format of win condition.', state.lineNumber);
        stream.match(reg_notcommentstart, true);
        return 'ERROR';
        
    } else {
        var candword = match[0].trim();
        if (state.tokenIndex === 0) {
            if (reg_winconditionquantifiers.exec(candword)) {
                return 'LOGICWORD';
            }
            else {
                return 'ERROR';
            }
        }
        else if (state.tokenIndex === 2) {
            if (candword != 'on') {
                return 'ERROR';
            } else {
                return 'LOGICWORD';
            }
        }
        else if (state.tokenIndex === 1 || state.tokenIndex === 3) {
            if (state.names.indexOf(candword) === -1) {
                logError('Error in win condition: "' + candword.toUpperCase() + '" is not a valid object name.', state.lineNumber);
                return 'ERROR';
            } else {
                return 'NAME';
            }
        }
    }
}

function levelsParser(stream, state, temp) {
    if (temp.sol) {
        if (stream.match(/\s*message\s*/, true)) {
            state.tokenIndex = 1;//1/2 = message/level
            var newdat = ['\n', temp.mixedCase.slice(stream.pos).trim(),state.lineNumber];
            if (state.levels[state.levels.length - 1].length == 0) {
                state.levels.splice(state.levels.length - 1, 0, newdat);
            } else {
                state.levels.push(newdat);
            }
            return 'MESSAGE_VERB';
        } else {
            var line = stream.match(reg_notcommentstart, false)[0].trim();
            state.tokenIndex = 2;
            var lastlevel = state.levels[state.levels.length - 1];
            if (lastlevel[0] == '\n') {
                state.levels.push([state.lineNumber,line]);
            } else {
                if (lastlevel.length==0)
                {
                    lastlevel.push(state.lineNumber);
                }
                lastlevel.push(line);
                
                if (lastlevel.length>1)
                {
                    if (line.length!=lastlevel[1].length) {
                        logWarning("Maps must be rectangular, yo (In a level, the length of each row must be the same).",state.lineNumber);
                    }
                }
            }
            
        }
    } else {
        if (state.tokenIndex == 1) {
            stream.skipToEnd();
            return 'MESSAGE';
        }
    }
    
    if (state.tokenIndex === 2 && !stream.eol()) {
        var ch = stream.peek();
        stream.next();
        if (state.abbrevNames.indexOf(ch) >= 0) {
            return 'LEVEL';
        } else {
            logError('Key "' + ch.toUpperCase() + '" not found. Do you need to add it to the legend, or define a new object?', state.lineNumber);
            return 'ERROR';
        }
    }
}

function preambleParser(stream, state, temp) {
    if (temp.sol) {
        state.tokenIndex = 0;
    }
    
    if (state.tokenIndex === 0) {
        var match = stream.match(/\s*\w+\s*/);
        if (match !== null) {
            var token = match[0].trim();
            if (temp.sol) {
                if (['title','author','homepage','background_color','text_color','key_repeat_interval','realtime_interval','again_interval','flickscreen','zoomscreen','color_palette','youtube'].indexOf(token)>=0) {
                    
                    if (token === 'youtube' || token === 'author' || token === 'title') {
                        stream.string = temp.mixedCase;
                    }
                    
                    var m2 = stream.match(reg_notcommentstart, false);
                    
                    if(m2 !== null) {
                        state.metadata.push(token);
                        state.metadata.push(m2[0].trim());
                    } else {
                        logError('MetaData "'+token+'" needs a value.',state.lineNumber);
                    }
                    state.tokenIndex=1;
                    return 'METADATA';
                } else if ( ['run_rules_on_level_start','norepeat_action','require_player_movement','debug','verbose_logging','throttle_movement','noundo','noaction','norestart','scanline'].indexOf(token)>=0) {
                    state.metadata.push(token);
                    state.metadata.push("true");
                    state.tokenIndex=-1;
                    return 'METADATA';
                } else  {
                    logError('Unrecognised stuff in metadata section.', state.lineNumber);
                    return 'ERROR';
                }
            } else if (state.tokenIndex==-1) {
                logError('MetaData "'+token+'" has no parameters.',state.lineNumber);
                return 'ERROR';
            }
            return 'METADATA';
        }
    } else {
        stream.match(reg_notcommentstart, true);
        return "METADATATEXT";
    }
}


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

var Message = {
    log: 'log',
    warning: 'warning',
    error: 'error',
};

var Token = {
    comment: 'comment',
    separator: 'EQUALSBIT',
    section: 'HEADER',
    option: 'METADATA',
    argument: 'METADATATEXT',
    name: 'NAME',
    color: 'COLOR',
    sprite: 'SPRITEMATRIX',
    sound_name: 'SOUNDVERB',
    sound: 'SOUND',
    direction: 'DIRECTION',
    modifier: 'DIRECTION',
    assignment: 'ASSSIGNMENT',
    operator: 'LOGICWORD',
    error: 'ERROR',
};

function types() {
    if (arguments.length == 0) {
        return null;
    }
    
    var res = arguments[0];
    for (var i = 1; i < arguments.length; i++) {
        res += ' ' + arguments[i];
    }
    return res;
}

function err(message, line, column) {
    return {
        message: message,
        line: line,
        column: column
    };
}

var commandwords = ["sfx0","sfx1","sfx2","sfx3","sfx4","sfx5","sfx6","sfx7","sfx8","sfx9","sfx10","cancel","checkpoint","restart","win","message","again"];
var reg_soundseed = /\d+\b/;
var reg_notcommentstart = /[^\(]+/;
var reg_csv_separators = /[ \,]*/;
var reg_directions = /^(action|up|down|left|right|\^|v|\<|\>|forward|moving|stationary|parallel|perpendicular|horizontal|orthogonal|vertical|no|randomdir|random)$/;
var reg_loopmarker = /^(startloop|endloop)$/;
var reg_ruledirectionindicators = /^(up|down|left|right|horizontal|vertical|orthogonal|late|rigid)$/;
var keyword_array = ['checkpoint','objects', 'collisionlayers', 'legend', 'sounds', 'rules', '...','winconditions', 'levels','|','[',']','up', 'down', 'left', 'right', 'late','rigid', '^','v','\>','\<','no','randomdir','random', 'horizontal', 'vertical','any', 'all', 'no', 'some', 'moving','stationary','parallel','perpendicular','action','message'];

// regular expressions
var reg = {
    // comments
    comment_begin: /\(/,
    comment_end: /\)/,
    
    // anything but the start of a comment
    no_comment: /[^(]/,
    
    // a word; a valid name for a variable
    word: /[a-z_]\w*/i,
    
    // a valid legend symbol
    legend_symbol: /[^()=]/i,
    
    // positive decimal integer
    int: /[0-9]+/,
    
    // named colors; must also match reg.word
    colors: /lightbrown|brown|darkbrown|black|darkgray|darkgrey|gray|grey|lightgray|lightgrey|white|pink|lightred|red|darkred|orange|yellow|lightgreen|green|darkgreen|lightblue|blue|darkblue|purple|transparent/i,
    
    // hexadecimal integer (starting with # as in colors)
    hex: /#[0-9a-f]+/i,
    
    // hex colors
    hex_color: /#(?:[0-9a-f]{3}){1,2}/i,
    
    // line separator (only for decoration)
    separator: /===+\s*/,
    
    // section names; must also match reg.word
    section: /objects|legend|sounds|collisionlayers|rules|winconditions|levels/i,
    
    // a single line of a sprite matrix
    sprite: /[.0-9]+/,
    
    // logical operator (used in legend); must also match reg.word
    operator: /and|or/i,
    
    // assignment operation
    assignment: /=/,
    
    // options which are either on or off (such as debug, noaction, noundo...)
    boolean_option: /run_rules_on_level_start|norepeat_action|require_player_movement|debug|verbose_logging|throttle_movement|noundo|noaction|norestart|scanline/i,
    
    // options with arguments (such as title, author, text_color...)
    valued_option: /title|author|homepage|background_color|text_color|key_repeat_interval|realtime_interval|again_interval|flickscreen|zoomscreen|color_palette|youtube/i,
    
    // events that can happen to an object
    object_events: /action|create|destroy|move|cantmove/i,
    
    // events that effect the entire game
    global_events: /undo|restart|cancel|titlescreen|startgame|endgame|startlevel|endlevel|showmessage|closemessage/i,
    
    // absolute dirs can be used anywhere
    absolute_directions: /up|down|left|right|horizontal|vertical/i,
    
    // relative dirs can only be used in reference to another direction
    relative_directions: /[^v<>]|parallel|perpendicular|orthogonal/i,
    
    // a descriptive word for specific objects
    object_modifier: /action|no|moving|stationary/i,
    
    // keywords that modify the function of a rule
    rule_modifier: /late|rigid|random/i,
    
    // command word after action
    basic_command: /cancel|checkpoint|restart|win|again/i,
    
    // used at the end of rules and between levels
    message_command: /message/i,
    
    // parts of a cell (in rules section)
    cell_start: /\[/,
    cell_separator: /\|/,
    cell_range: /\.\.\./,
    cell_start: /\]/,
    
    // symbol which binds two sets of cells into a rule
    rule_binding: /->/,
    
    // quantifiers for win conditions
    win_quantifiers: /all|some|no|any/i,
};

// moving must be preceeded by moving



// Returns an object containing methods for tokenizing text using stored states
function parser() {
    return {
        startState: function() {
            return {};
        },
        copyState: copySimpleObject,
        token: tokenizer
    };
}

// Copies a simple javascript object
// A simple object is one which contains only strings, numbers, booleans,
// undefined values, and other simple objects. It must also be non-recursive.
function copySimpleObject(obj) {
    var newobj = {};
    for (var key in obj) {
        if (typeof obj[key] === 'object') {
            newobj[key] = copySimpleObject(obj[key])
        } else {
            newobj[key] = obj[key];
        }
    }
    return newobj;
}

// Ensures that a certain key exists in an object
// If a key doesn't exist in an object, set it to the specified value
// Otherwise, do nothing
function ensure(object, key, value) {
    if (!(key in object)) {
        object[key] = value;
    }
}

// Takes a text stream and state object (representing the current state of the
// tokenizer), eats characters from the stream, and returns the type of token
// (as a string) or null
// Result object builds up tokens and errors for use in compilation
// This method is just a wrapper for tokenizer_main
function tokenizer(stream, state, result) {
    // for debugging purposes only
    result = {};
    
    // If parsing for compilation, the line number should be provided in the
    // state object. This is because there's no reliable way to keep track of
    // line numbers inside this function. If not compiling, provide a dummy
    // line number
    ensure(state, 'line', 0);
    
    // starting position of the next token
    var start_pos = stream.pos;
    
    // create a dummy result object if necessary
    if (!result) {
        result = {
            add: function() {},
            log: function() {},
            warn: function() {},
            err: function() {},
        };
        
    // a result object (for compilation) was provided
    // ensure that it has usesful features
    } else {
        ensure(result, 'tokens', []); // all generated tokens
        ensure(result, 'messages', []); // messages array
        
        // add token function
        result.add = function(type, value) {
            result.tokens.push({
                type: type,
                value: value,
                line: state.line,
                column: start_pos,
            });
        }
        
        // add message logging functionality
        result.message = function(type, text) {
            result.messages.push({
                type: type,
                text: text,
                line: state.line,
                column: start_pos
            });
            console.log(result.messages[result.messages.length - 1]);
        }
        result.log = function(text) {
            result.message(Message.log, text);
        }
        result.warn = function(text) {
            result.message(Message.warning, text);
        }
        result.err = function(text) {
            result.message(Message.error, text);
        }
    }
    
    // get the next token type (updating stream pos)
    var type = tokenizer_main(stream, state, result);
    
    // add to the array if token is not empty
    if (stream.pos > start_pos) {
        var token = stream.string.substring(start_pos, stream.pos);
        result.add(type, token);
    }
    
    return type;
}

// Main tokenizer functionality
function tokenizer_main(stream, state, result) {
    ensure(state, 'sol', false); // at the start of the line?
    ensure(state, 'code', false); // have we parsed any new code?
    ensure(state, 'last_pos', 0); // last stream posisition
    ensure(state, 'comment_level', 0); // depth of nested comments
    ensure(state, 'separator', false); // are we on a separator line?
    ensure(state, 'section', 'preamble'); // what section are we in?
    
    // if we haven't moved since the last run, we haven't parsed any code
    if (state.last_pos === stream.pos) {
        state.code = false;
    }
    state.last_pos = stream.pos;
    
    // state.sol should be true when we are at the start of a line,
    // excluding whitespace and comments
    if (state.code) {
        state.sol = false;
    }
    
    // at start of a line
    if (stream.sol()) {
        state.sol = true;
        state.code = false;
    }
    
    /////////////////////////////
    // Whitespace and Comments //
    /////////////////////////////
    
    // ignore any whitespace
    if (stream.eatSpace()) {
        return null;
    }
    
    // already inside a comment
    if (state.comment_level > 0) {
        return parseComment(stream, state);
    }
    
    // entering a new comment
    if (stream.match(reg.comment_begin)) {
        state.comment_level += 1;
        return parseComment(stream, state);
    }
    
    // unmatched ending comment
    if (stream.match(reg.comment_end)) {
        return Token.error;
    }
    
    // everything after this point is considered meaningful code
    // whitespace and comments are not
    state.code = true;
    
    ///////////////////////////////////
    // Separators and Section Titles //
    ///////////////////////////////////
    
    // following a separator (in the same line)
    if (!state.sol && state.separator) {
        stream.next();
        return Token.separator;
    } else {
        state.separator = false;
    }
    
    // match a separator
    if (stream.sol() && stream.match(reg.separator)) {
        if (!stream.eol()) {
            state.separator = true;
        }
        return Token.separator;
    }
    
    // match section titles
    var match = stream.match(reg.section);
    if (match) {
        state.section = match[0].toLowerCase();
        return Token.section;
    }
    
    // section-specific parsing
    switch (state.section) {
        case 'preamble':
            return parsePreamble(stream, state, result);
            
        case 'objects':
            return parseObjects(stream, state, result);
            
        case 'legend':
            return parseLegend(stream, state, result);
            
        case 'sounds':
            return parseSounds(stream, state, result);
            
        case 'collisionlayers':
            return parseCollisionLayers(stream, state, result);
            
        case 'rules':
            return parseRules(stream, state, result);
            
        case 'winconditions':
            return parseWinConditions(stream, state, result);
            
        case 'levels':
            return parseLevels(stream, state, result);
            
        default:
            stream.skipToEnd();
            return Token.error;
    }
    
    // fallback (we shouldn't get here, but just in case)
    stream.next();
    result.err('Unknown error while parsing');
    return Token.error;
}

function parseComment(stream, state, result) {
    while (!stream.eol() && state.comment_level > 0) {
        if (stream.eat(reg.comment_begin)) {
            state.comment_level += 1;
        } else if (stream.eat(reg.comment_end)) {
            state.comment_level -= 1;
        } else {
            stream.next();
        }
    }
    return Token.comment;
}

// parsing function for the preamble section
function parsePreamble(stream, state, result) {
    ensure(state, 'option_identifier', true);
    
    // parse an option identifier
    if (state.option_identifier) {
        
        // try to match a word
        var match = stream.match(reg.word);
        if (match) {
            var word = match[0];
            
            // try to match a boolean option
            if (word.match(reg.boolean_option)) {
                return Token.option;
                
            // try to match a valued option
            } else if (word.match(reg.valued_option)) {
                state.option_identifier = false;
                return Token.option;
                
            // didn't match any known identifiers
            } else {
                result.err('Preamble option "' + word + '" didn\'t match any known identifiers.');
                return Token.error;
            }
            
        // didn't match a word
        } else {
            result.err('Unexpected symbol "' + stream.next() + '"');
            return Token.error;
        }
        
    // not parsing an option identifier
    // parse the argument to a valued option
    } else {
        state.option_identifier = true;
        stream.skipToEnd();
        return Token.argument;
    }
}

function parseObjects(stream, state, result) {
    ensure(state, 'subsection', 'name');
    ensure(state, 'complete', false);
    ensure(state, 'last_line', 0);
    
    if (state.subsection === 'name') {
        // object name subsection
        
        // if finished parsing the name
        if (state.complete) {
            if (state.sol) {
                state.complete = false;
                state.subsection = 'colors';
                return null;
            } else {
                result.err('Unexpected symbol "' + stream.next() + '"');
                return Token.error;
            }
        }
        
        // haven't parsed the name yet
        var match = stream.match(reg.word);
        if (match) {
            state.complete = true;
            return Token.name;
        } else {
            result.err('Unexpected symbol "' + stream.next() + '"');
            return Token.error;
        }
        
    } else if (state.subsection === 'colors') {
        // colors subsection
        
        if (state.complete && state.sol) {
            state.complete = false;
            if (stream.eol()) {
                state.subsection = 'name';
            } else {
                state.subsection = 'sprite';
                state.last_line = state.line;
            }
            return null;
        }
        
        var match;
        
        // try to parse a color word
        match = stream.match(reg.word);
        if (match) {
            var word = match[0];
            var color = word.match(reg.colors);
            
            // if entire word is a valid color
            if (color && color[0] === word) {
                state.complete = true;
                return Token.color;
            } else {
                result.err('Unrecognized color "' + word + '"');
                return Token.error;
            }
        }
        
        // try to parse a hex color
        match = stream.match(reg.hex);
        if (match) {
            var hex = match[0];
            var color = hex.match(reg.hex_color);
            
            // if entire hex number is a valid color
            if (color && color[0] === hex) {
                state.complete = true;
                return Token.color;
            } else {
                result.err('Unrecognized color "' + hex + '"');
                return Token.error;
            }
        }
        
        result.err('Unexpected symbol "' + stream.next() + '". Expected a color');
        return Token.error;
        
    } else if (state.subsection === 'sprite') {
        // sprite subsection
        
        if (state.sol) {
            if (!stream.sol()) {
                result.warn('Spacing before sprite rows should be avoided');
            }
            
            if (stream.match(reg.sprite)) {
                if (state.line - state.last_line > 1) {
                    result.warn('Empty lines between sprite rows should be avoided');
                }
                state.last_line = state.line;
                return Token.sprite;
                
            } else {
                state.subsection = 'name';
                state.complete = false;
                return null;
            }
        }
        
        if (stream.match(reg.sprite)) {
            result.err('Each row of the sprite must be on separate new line');
            return null;
        }
        
        result.err('Unexpected symbol "' + stream.next() + '"');
        return Token.error;
        
    } else {
        result.err('Parsing function error. Unknown object section "' + state.subsection + '"');
        state.subsection = 'name';
        return null;
    }
}

function parseLegend(stream, state, result) {
    ensure(state, 'op_type', null);
    
    // subsections for each line of the legend:
    // name assignment object [operator object]*
    
    if (state.sol) {
        if (state.subsection === 'assignment') {
            result.err('Unexpected end of line. Incomplete legend assignment');
        } else if (state.subsection === 'object') {
            if (state.op_type === null) {
                result.err('Unexpected end of line. Missing assignment');
            } else {
                result.err('Unexpected end of line. Trailing operator');
            }
        }
        
        state.op_type = null;
        state.subsection = 'name';
    }
    
    if (state.subsection === 'name') {
        // name subsection
        
        if (stream.match(reg.word) || stream.match(reg.legend_symbol)) {
            state.subsection = 'assignment';
            return Token.name;
            
        } else {
            result.err('Unexpected symbol "' + stream.next() + '"');
            return Token.error;
        }
        
    } else if (state.subsection === 'assignment') {
        // assignment subsection
        
        if (stream.match(reg.assignment)) {
            state.subsection = 'object';
            return Token.assignment;
            
        } else {
            result.err('Unexpected symbol "' + stream.next() + '"');
            return Token.error;
        }
        
    } else if (state.subsection === 'object') {
        // object subsection
        
        if (stream.match(reg.word)) {
            state.subsection = 'operator';
            return Token.name;
            
        } else {
            result.err('Unexpected symbol "' + stream.next + '". Expected an object name');
            return Token.error;
        }
        
    } else if (state.subsection === 'operator') {
        // operator subsection
        
        var word = stream.match(reg.word);
        if (word) {
            // matched a word; get string part
            word = word[0];
            
            var op = word.match(reg.operator);
            if (op && op[0] === word) {
                // entire word matched an operaator; get string part
                op = op[0];
                
                if (op !== state.op_type && state.op_type !== null) {
                    result.err('Cannot mix operator types.');
                    return Tooken.error;
                }
                
                state.op_type = op;
                state.subsection = 'object';
                return Token.operator;
                
            } else {
                // entire word isn't an operator
                result.err('Unexpected word + "' + word + '". Expected an operator');
                return Token.error;
            }
            
        } else {
            // next symbol isn't a word at all
            result.err('Unexpected symbol "' + stream.next() + '". Expected an operator');
            return Token.error;
        }
        
    } else {
        // not start of line and unrecognized subsection
        result.err('Unrecognized section. This error shouldn\'t ever occur');
        state.section = 'name';
        return null;
    }
}

function parseSounds(stream, state, result) {
    var name = stream.match(reg.sound_verbs, true);
    if (name !== null) {
        return Token.sound_name;
    }
    
    name = stream.match(reg.sound_directions, true);
    if (name !== null) {
        return Token.direction;
    }
    
    name = stream.match(reg.int, true);
    if (name !== null) {
        return Token.sound;
    }
    
    name = stream.match(/[^\[\|\]\s]*/, true);
    if (name !== null) {
        return Token.name;
    }
    
    state.err('Unexpected symbol "' + stream.next() + '"');
    return Token.error;
}

function parseCollisionLayers(stream, state, result) {
    
    
    stream.next();
    return null;
}

function parseRules(stream, state, result) {
    stream.next();
    return null;
}

function parseWinConditions(stream, state, result) {
    stream.next();
    return null;
}

function parseLevels(stream, state, result) {
    stream.next();
    return null;
}

// window.CodeMirror.defineMode('puzzle', codeMirrorFn);
window.CodeMirror.defineMode('puzzle', parser);
