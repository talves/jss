(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var jss = require('../..')
var style = require('./style')

jss.createStylesheet(style.rules).attach()

var button = document.getElementsByTagName('button')[0]
var div = document.getElementsByTagName('div')[0]

button.addEventListener('click', function () {
    div.style.width = style.square.width + 50 + 'px'
    div.style.height = style.square.height + 50 + 'px'
})


},{"../..":3,"./style":2}],2:[function(require,module,exports){
var rules = exports.rules = {}

var square = exports.square = {
    width: 100,
    height: 100
}

rules['.square'] = {
    float: 'left',
    background: 'red',
    width: square.width + 'px',
    height: square.height + 'px'
}

},{}],3:[function(require,module,exports){
module.exports = require('./lib/index')

},{"./lib/index":6}],4:[function(require,module,exports){
'use strict'

var uid = 0

var processors = []

/**
 * Rule is selector + style hash.
 *
 * @param {String} [selector]
 * @param {Object} style is property:value hash.
 * @param {Object} [stylesheet]
 * @api public
 */
function Rule(selector, style, stylesheet) {
    if (typeof selector == 'object') {
        stylesheet = style
        style = selector
        selector = null
    }

    if (selector) {
        this.selector = selector
    } else {
        this.className = Rule.NAMESPACE_PREFIX + '-' + uid
        uid++
        this.selector = '.' + this.className
    }

    this.stylesheet = stylesheet
    this.style = style
}

module.exports = Rule

Rule.NAMESPACE_PREFIX = 'jss'

/**
 * Add a preprocessor.
 *
 * @param {Function} fn
 * @return {Array}
 * @api public
 */
Rule.addPreprocessor = function (fn) {
    processors.push(fn)
    return processors
}

/**
 * Execute all registered preprocessors.
 *
 * @api private
 */
Rule.prototype.runPreprocessors = function () {
    for (var i = 0; i < processors.length; i++) {
        processors[i](this)
    }

    return this
}

/**
 * Converts the rule to css string.
 *
 * @return {String}
 * @api public
 */
Rule.prototype.toString = function () {
    var style = this.style
    var str = this.selector + ' {'

    for (var prop in style) {
        str += '\n  ' + prop + ': ' + style[prop] + ';'
    }

    str += '\n}'

    return str
}

},{}],5:[function(require,module,exports){
'use strict'

var Rule = require('./Rule')

/**
 * Stylesheet abstraction, contains rules, injects stylesheet into dom.
 *
 * @param {Object} [rules] object with selectors and declarations
 * @param {Object} [generateClasses] generate selectors instead of using rules property as selector.
 * @param {Object} [attributes] stylesheet element attributes
 * @api public
 */
function Stylesheet(rules, generateClasses, attributes) {
    if (typeof generateClasses == 'object') {
        attributes = generateClasses
        generateClasses = false
    }
    this.element = null
    this.attached = false
    this.generateClasses = generateClasses || false
    this.rules = {}
    this.attributes = attributes || {}
    this.classes = generateClasses ? {} : null
    if (!this.attributes.type) this.attributes.type = 'text/css'
    if (!this.attributes.media) this.attributes.media = 'screen'
    if (!this.attributes.title) this.attributes.title = 'Generated by jss.'

    if (rules) this.addRules(rules)
}

module.exports = Stylesheet

/**
 * Insert stylesheet element to render tree.
 *
 * @api public
 * @return {Stylesheet}
 */
Stylesheet.prototype.attach = function () {
    if (this.attached) return this

    if (!this.element) {
        this.element = this.createElement()
        this.element.innerHTML = this.toString()
    }

    document.head.appendChild(this.element)
    this.attached = true

    return this
}

/**
 * Remove stylesheet element from render tree.
 *
 * @return {Stylesheet}
 * @api public
 */
Stylesheet.prototype.detach = function () {
    if (!this.attached) return this

    this.element.parentNode.removeChild(this.element)
    this.attached = false

    return this
}

/**
 * Add a rule to the current stylesheet.
 *
 * @param {Object} [selector] if you don't pass selector - it will be generated
 * @param {Object} style property/value hash
 * @return {Stylesheet}
 * @api public
 */
Stylesheet.prototype.addRule = function (selector, style) {
    var rule = new Rule(selector, style, this)
    var sheet = this.element.sheet
    sheet.insertRule(rule.toString(), sheet.cssRules.length)
    this.rules[rule.selector] = rule

    return rule
}

/**
 * Get a rule.
 *
 * @param {String} selector
 * @return {Rule}
 * @api public
 */
Stylesheet.prototype.getRule = function (selector) {
    return this.rules[selector]
}

/**
 * Add rules to the current stylesheet.
 *
 * @param {Object} rules selector:style hash.
 * @return {Stylesheet} this
 * @api public
 */
Stylesheet.prototype.addRules = function (rules) {
    var selector
    for (var key in rules) {
        if (!this.generateClasses) selector = key
        var rule = new Rule(selector, rules[key], this)
        this.rules[rule.selector] = rule
        rule.runPreprocessors()
        if (this.generateClasses) this.classes[key] = rule.className
    }

    return this
}

/**
 * Convert rules to a css string.
 *
 * @api public
 * @return {String}
 */
Stylesheet.prototype.toString = function () {
    var str = ''
    var rules = this.rules

    for (var selector in rules) {
        if (str) str += '\n'
        str += rules[selector].toString()
    }

    return str
}

/**
 * Create stylesheet element.
 *
 * @api private
 * @return {Element}
 */
Stylesheet.prototype.createElement = function () {
    var el = document.createElement('style')
    for (var name in this.attributes) el.setAttribute(name, this.attributes[name])

    return el
}

},{"./Rule":4}],6:[function(require,module,exports){
/**
 * Stylesheets written in javascript.
 *
 * @copyright Oleg Slobodskoi 2014
 * @website https://github.com/kof/jss
 * @license MIT
 */

'use strict'

var Stylesheet = require('./Stylesheet')
var Rule = require('./Rule')

// Register default processors.
;[
    require('./processors/nested'),
    require('./processors/extend')
].forEach(Rule.addPreprocessor)

exports.Stylesheet = Stylesheet

exports.Rule = Rule

/**
 * Create a stylesheet.
 *
 * @param {Object} rules is selector:style hash.
 * @param {Object} [generateClasses] generate class names instead of using rules property as selector.
 * @param {Object} [attributes] stylesheet element attributes.
 * @return {Stylesheet}
 * @api public
 */
exports.createStylesheet = function (rules, generateClasses, attributes) {
    return new Stylesheet(rules, generateClasses, attributes)
}

/**
 * Create a rule.
 *
 * @param {String} [selector]
 * @param {Object} style is property:value hash.
 * @return {Rule}
 * @api public
 */
exports.createRule = function (selector, style) {
    return new Rule(selector, style)
}

},{"./Rule":4,"./Stylesheet":5,"./processors/extend":7,"./processors/nested":8}],7:[function(require,module,exports){
'use strict'

/**
 * Handle `extend` property.
 *
 * @param {Rule} rule
 * @api private
 */
module.exports = function (rule) {
    var style = rule.style

    if (!style) return

    var extend = style.extend

    if (!extend) return

    var newStyle = {}
    var prop

    // Copy extend style.
    if ('length' in extend) {
        for (var i = 0; i < extend.length; i++) {
            for (prop in extend[i]) newStyle[prop] = extend[i][prop]
        }
    } else {
        for (prop in extend) newStyle[prop] = extend[prop]
    }


    // Copy original style.
    for (prop in style) {
        if (prop != 'extend') newStyle[prop] = style[prop]
    }

    rule.style = newStyle
}

},{}],8:[function(require,module,exports){
'use strict'

var Rule = require('../Rule')

/**
 * Convert nested rules to separate, remove them from original styles.
 *
 * @param {Rule} rule
 * @api private
 */
module.exports = function (rule) {
    var stylesheet = rule.stylesheet
    var style = rule.style

    for (var prop in style) {
        if (prop[0] == '&') {
            var selector = rule.selector + prop.substr(1)
            stylesheet.rules[selector] = new Rule(selector, style[prop], stylesheet)
            delete style[prop]
        }
    }
}

},{"../Rule":4}]},{},[1]);
