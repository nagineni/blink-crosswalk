var initialize_InspectorTest = function() {

var results = [];
var resultsSynchronized = false;

function consoleOutputHook(messageType)
{
    InspectorTest.addResult(messageType + ": " + Array.prototype.slice.call(arguments, 1));
}

console.log = consoleOutputHook.bind(InspectorTest, "log");
console.error = consoleOutputHook.bind(InspectorTest, "error");
console.info = consoleOutputHook.bind(InspectorTest, "info");
console.assert = function(condition, object)
{
    if (condition)
        return;
    var message = "Assertion failed: " + (typeof object !== "undefined" ? object : "");
    InspectorTest.addResult(new Error(message).stack);
}

InspectorTest.Output = {   // override in window.initialize_yourName
    testComplete: function() 
    {
        RuntimeAgent.evaluate("didEvaluateForTestInFrontend(" + InspectorTest.completeTestCallId + ", \"\")", "test");
    },

    addResult: function(text) 
    {
        InspectorTest.evaluateInPage("output(unescape('" + escape(text) + "'))");
    },
    
    clearResults: function() 
    {
        InspectorTest.evaluateInPage("clearOutput()");
    }
};

InspectorTest.startDumpingProtocolMessages = function()
{
    InspectorBackendClass.Connection.prototype._dumpProtocolMessage = testRunner.logToStderr.bind(testRunner);
    InspectorBackendClass.Options.dumpInspectorProtocolMessages = 1;
}

InspectorTest.completeTest = function()
{
    InspectorTest.Output.testComplete();
}

InspectorTest.evaluateInConsole = function(code, callback)
{
    callback = InspectorTest.safeWrap(callback);

    WebInspector.inspectorView.panel("console");
    var consoleView = WebInspector.ConsolePanel._view();
    consoleView.visible = true;
    consoleView._prompt.text = code;
    var event = document.createEvent("KeyboardEvent");
    event.initKeyboardEvent("keydown", true, true, null, "Enter", "");
    consoleView._prompt.proxyElement.dispatchEvent(event);
    InspectorTest.addConsoleSniffer(
        function(commandResult) {
            callback(commandResult.toMessageElement().textContent);
        });
}

InspectorTest.evaluateInConsoleAndDump = function(code, callback)
{
    callback = InspectorTest.safeWrap(callback);

    function mycallback(text)
    {
        InspectorTest.addResult(code + " = " + text);
        callback(text);
    }
    InspectorTest.evaluateInConsole(code, mycallback);
}

InspectorTest.evaluateInPage = function(code, callback)
{
    callback = InspectorTest.safeWrap(callback);

    function mycallback(error, result, wasThrown)
    {
        if (!error)
            callback(WebInspector.runtimeModel.createRemoteObject(result), wasThrown);
    }
    RuntimeAgent.evaluate(code, "console", false, mycallback);
}

InspectorTest.evaluateInPageWithTimeout = function(code)
{
    InspectorTest.evaluateInPage("setTimeout(unescape('" + escape(code) + "'))");
}

var lastEvalId = 0;
var pendingEvalRequests = {};

InspectorTest.invokePageFunctionAsync = function(functionName, callback)
{
    var id = ++lastEvalId;
    pendingEvalRequests[id] = InspectorTest.safeWrap(callback);
    var asyncEvalWrapper = function(callId, functionName)
    {
        function evalCallback(result)
        {
            testRunner.evaluateInWebInspector(evalCallbackCallId, "InspectorTest.didInvokePageFunctionAsync(" + callId + ", " + JSON.stringify(result) + ");");
        }
        eval(functionName + "(" + evalCallback + ")");
    }
    InspectorTest.evaluateInPage("(" + asyncEvalWrapper.toString() + ")(" + id + ", unescape('" + escape(functionName) + "'))");
}

InspectorTest.didInvokePageFunctionAsync = function(callId, value)
{
    var callback = pendingEvalRequests[callId];
    if (!callback) {
        InspectorTest.addResult("Missing callback for async eval " + callId + ", perhaps callback invoked twice?");
        return;
    }
    delete pendingEvalRequests[callId];
    callback(value);
}

InspectorTest.check = function(passCondition, failureText)
{
    if (!passCondition)
        InspectorTest.addResult("FAIL: " + failureText);
}

InspectorTest.addResult = function(text)
{
    results.push(text);
    if (resultsSynchronized)
        InspectorTest.Output.addResult(text);
    else {
        InspectorTest.Output.clearResults();
        for (var i = 0; i < results.length; ++i)
            InspectorTest.Output.addResult(results[i]);
        resultsSynchronized = true;
    }
}

InspectorTest.addResults = function(textArray)
{
    if (!textArray)
        return;
    for (var i = 0, size = textArray.length; i < size; ++i)
        InspectorTest.addResult(textArray[i]);
}

window.onerror = function (message, filename, lineno, colno, error)
{
    InspectorTest.addResult("Uncaught exception in inspector front-end: " + message + " [" + error.stack + "]");
    InspectorTest.completeTest();
}

InspectorTest.formatters = {};

InspectorTest.formatters.formatAsTypeName = function(value)
{
    return "<" + typeof value + ">";
}

InspectorTest.formatters.formatAsRecentTime = function(value)
{
    if (typeof value !== "object" || !(value instanceof Date))
        return InspectorTest.formatAsTypeName(value);
    var delta = Date.now() - value;
    return 0 <= delta && delta < 30 * 60 * 1000 ? "<plausible>" : value;
}

InspectorTest.formatters.formatAsURL = function(value)
{
    if (!value)
        return value;
    var lastIndex = value.lastIndexOf("inspector/");
    if (lastIndex < 0)
        return value;
    return ".../" + value.substr(lastIndex);
}

InspectorTest.addObject = function(object, customFormatters, prefix, firstLinePrefix)
{
    prefix = prefix || "";
    firstLinePrefix = firstLinePrefix || prefix;
    InspectorTest.addResult(firstLinePrefix + "{");
    var propertyNames = Object.keys(object);
    propertyNames.sort();
    for (var i = 0; i < propertyNames.length; ++i) {
        var prop = propertyNames[i];
        if (!object.hasOwnProperty(prop))
            continue;
        var prefixWithName = "    " + prefix + prop + " : ";
        var propValue = object[prop];
        if (customFormatters && customFormatters[prop]) {
            var formatterName = customFormatters[prop];
            if (formatterName !== "skip") {
                var formatter = InspectorTest.formatters[formatterName];
                InspectorTest.addResult(prefixWithName + formatter(propValue));
            }
        } else
            InspectorTest.dump(propValue, customFormatters, "    " + prefix, prefixWithName);
    }
    InspectorTest.addResult(prefix + "}");
}

InspectorTest.addArray = function(array, customFormatters, prefix, firstLinePrefix)
{
    prefix = prefix || "";
    firstLinePrefix = firstLinePrefix || prefix;
    InspectorTest.addResult(firstLinePrefix + "[");
    for (var i = 0; i < array.length; ++i)
        InspectorTest.dump(array[i], customFormatters, prefix + "    ");
    InspectorTest.addResult(prefix + "]");
}

InspectorTest.dump = function(value, customFormatters, prefix, prefixWithName)
{
    prefixWithName = prefixWithName || prefix;
    if (prefixWithName && prefixWithName.length > 80) {
        InspectorTest.addResult(prefixWithName + "was skipped due to prefix length limit");
        return;
    }
    if (value === null)
        InspectorTest.addResult(prefixWithName + "null");
    else if (value instanceof Array)
        InspectorTest.addArray(value, customFormatters, prefix, prefixWithName);
    else if (typeof value === "object")
        InspectorTest.addObject(value, customFormatters, prefix, prefixWithName);
    else if (typeof value === "string")
        InspectorTest.addResult(prefixWithName + "\"" + value + "\"");
    else
        InspectorTest.addResult(prefixWithName + value);
}

InspectorTest.assertGreaterOrEqual = function(a, b, message)
{
    if (a < b)
        InspectorTest.addResult("FAILED: " + (message ? message + ": " : "") + a + " < " + b);
}

InspectorTest.registerModule = function(moduleName, loadImmediately)
{
    runtime._registerModule(moduleName);
    if (loadImmediately)
        runtime.loadModule(moduleName);
}

InspectorTest.navigate = function(url, callback)
{
    InspectorTest._pageLoadedCallback = InspectorTest.safeWrap(callback);

    WebInspector.inspectorView.panel("network")._networkLogView._reset();
    InspectorTest.evaluateInConsole("window.location = '" + url + "'");
}

InspectorTest.recordNetwork = function()
{
    WebInspector.inspectorView.panel("network")._networkLogView._recordButton.toggled = true;
}

InspectorTest.hardReloadPage = function(callback, scriptToEvaluateOnLoad, scriptPreprocessor)
{
    InspectorTest._innerReloadPage(true, callback, scriptToEvaluateOnLoad, scriptPreprocessor);
}

InspectorTest.reloadPage = function(callback, scriptToEvaluateOnLoad, scriptPreprocessor)
{
    InspectorTest._innerReloadPage(false, callback, scriptToEvaluateOnLoad, scriptPreprocessor);
}

InspectorTest._innerReloadPage = function(hardReload, callback, scriptToEvaluateOnLoad, scriptPreprocessor)
{
    InspectorTest._pageLoadedCallback = InspectorTest.safeWrap(callback);

    if (WebInspector.panels.network)
        WebInspector.panels.network._networkLogView._reset();
    PageAgent.reload(hardReload, scriptToEvaluateOnLoad, scriptPreprocessor);
}

InspectorTest.pageLoaded = function()
{
    resultsSynchronized = false;
    InspectorTest.addResult("Page reloaded.");
    if (InspectorTest._pageLoadedCallback) {
        var callback = InspectorTest._pageLoadedCallback;
        delete InspectorTest._pageLoadedCallback;
        callback();
    }
}

InspectorTest.runWhenPageLoads = function(callback)
{
    var oldCallback = InspectorTest._pageLoadedCallback;
    function chainedCallback()
    {
        if (oldCallback)
            oldCallback();
        callback();
    }
    InspectorTest._pageLoadedCallback = InspectorTest.safeWrap(chainedCallback);
}

InspectorTest.runAfterPendingDispatches = function(callback)
{
    callback = InspectorTest.safeWrap(callback);
    InspectorBackend.connection().runAfterPendingDispatches(callback);
}

InspectorTest.createKeyEvent = function(keyIdentifier, ctrlKey, altKey, shiftKey, metaKey)
{
    var evt = document.createEvent("KeyboardEvent");
    evt.initKeyboardEvent("keydown", true /* can bubble */, true /* can cancel */, null /* view */, keyIdentifier, "", ctrlKey, altKey, shiftKey, metaKey);
    return evt;
}

InspectorTest.runTestSuite = function(testSuite)
{
    var testSuiteTests = testSuite.slice();

    function runner()
    {
        if (!testSuiteTests.length) {
            InspectorTest.completeTest();
            return;
        }
        var nextTest = testSuiteTests.shift();
        InspectorTest.addResult("");
        InspectorTest.addResult("Running: " + /function\s([^(]*)/.exec(nextTest)[1]);
        InspectorTest.safeWrap(nextTest)(runner);
    }
    runner();
}

InspectorTest.assertEquals = function(expected, found, message)
{
    if (expected === found)
        return;

    var error;
    if (message)
        error = "Failure (" + message + "):";
    else
        error = "Failure:";
    throw new Error(error + " expected <" + expected + "> found <" + found + ">");
}

InspectorTest.assertTrue = function(found, message)
{
    InspectorTest.assertEquals(true, !!found, message);
}

InspectorTest.safeWrap = function(func, onexception)
{
    function result()
    {
        if (!func)
            return;
        var wrapThis = this;
        try {
            return func.apply(wrapThis, arguments);
        } catch(e) {
            InspectorTest.addResult("Exception while running: " + func + "\n" + (e.stack || e));
            if (onexception)
                InspectorTest.safeWrap(onexception)();
            else
                InspectorTest.completeTest();
        }
    }
    return result;
}

InspectorTest.addSniffer = function(receiver, methodName, override, opt_sticky)
{
    override = InspectorTest.safeWrap(override);

    var original = receiver[methodName];
    if (typeof original !== "function")
        throw ("Cannot find method to override: " + methodName);

    receiver[methodName] = function(var_args) {
        try {
            var result = original.apply(this, arguments);
        } finally {
            if (!opt_sticky)
                receiver[methodName] = original;
        }
        // In case of exception the override won't be called.
        try {
            Array.prototype.push.call(arguments, result);
            override.apply(this, arguments);
        } catch (e) {
            throw ("Exception in overriden method '" + methodName + "': " + e);
        }
        return result;
    };
}

InspectorTest.addConsoleSniffer = function(override, opt_sticky)
{
    var sniffer = function (viewMessage) {
        override(viewMessage);
    };

    WebInspector.inspectorView.panel("console");
    InspectorTest.addSniffer(WebInspector.ConsoleView.prototype, "_showConsoleMessage", sniffer, opt_sticky);
}

InspectorTest.override = function(receiver, methodName, override, opt_sticky)
{
    override = InspectorTest.safeWrap(override);

    var original = receiver[methodName];
    if (typeof original !== "function")
        throw ("Cannot find method to override: " + methodName);

    receiver[methodName] = function(var_args) {
        try {
            try {
                var result = override.apply(this, arguments);
            } catch (e) {
                throw ("Exception in overriden method '" + methodName + "': " + e);
            }
        } finally {
            if (!opt_sticky)
                receiver[methodName] = original;
        }
        return result;
    };

    return original;
}

InspectorTest.textContentWithLineBreaks = function(node)
{
    function padding(currentNode)
    {
        var result = 0;
        while (currentNode && currentNode !== node) {
            if (currentNode.nodeName === "OL")
                ++result;
            currentNode = currentNode.parentNode;
        }
        return Array(result * 4 + 1).join(" ");
    }

    var buffer = "";
    var currentNode = node;
    while (currentNode = currentNode.traverseNextNode(node)) {
        if (currentNode.nodeType === Node.TEXT_NODE)
            buffer += currentNode.nodeValue;
        else if (currentNode.nodeName === "LI")
            buffer += "\n" + padding(currentNode);
        else if (currentNode.classList.contains("console-message"))
            buffer += "\n\n";
    }
    return buffer;
}

InspectorTest.hideInspectorView = function()
{
    WebInspector.inspectorView.element.setAttribute("style", "display:none !important");
}

InspectorTest.StringOutputStream = function(callback)
{
    this._callback = callback;
    this._buffer = "";
};

InspectorTest.StringOutputStream.prototype = {
    open: function(fileName, callback)
    {
        callback(true);
    },

    write: function(chunk, callback)
    {
        this._buffer += chunk;
        if (callback)
            callback(this);
    },

    close: function()
    {
        this._callback(this._buffer);
    }
};

InspectorTest.MockSetting = function(value)
{
    this._value = value;
};

InspectorTest.MockSetting.prototype = {
    get: function() {
        return this._value;
    },

    set: function(value) {
        this._value = value;
    }
};


/**
 * @constructor
 * @param {!string} dirPath
 * @param {!string} name
 * @param {!function(?WebInspector.TempFile)} callback
 */
InspectorTest.TempFileMock = function(dirPath, name, callback)
{
    this._chunks = [];
    this._name = name;
    setTimeout(callback.bind(this, this), 0);
}

InspectorTest.TempFileMock.prototype = {
    /**
     * @param {!Array.<string>} strings
     * @param {!function(boolean)} callback
     */
    write: function(strings, callback)
    {
        this._chunks.push.apply(this._chunks, strings);
        setTimeout(callback.bind(this, true), 0);
    },

    finishWriting: function() { },

    /**
     * @param {function(?string)} callback
     */
    read: function(callback)
    {
        callback(this._chunks.join(""));
    },

    /**
     * @param {!WebInspector.OutputStream} outputStream
     * @param {!WebInspector.OutputStreamDelegate} delegate
     */
    writeToOutputSteam: function(outputStream, delegate)
    {
        var name = this._name;
        var text = this._chunks.join("");
        var chunkedReaderMock = {
            loadedSize: function()
            {
                return text.length;
            },

            fileSize: function()
            {
                return text.length;
            },

            fileName: function()
            {
                return name;
            },

            cancel: function() { }
        }
        delegate.onTransferStarted(chunkedReaderMock);
        outputStream.write(text);
        delegate.onChunkTransferred(chunkedReaderMock);
        outputStream.close();
        delegate.onTransferFinished(chunkedReaderMock);
    },

    remove: function() { }
}

InspectorTest.dumpLoadedModules = function(next)
{
    function moduleSorter(left, right)
    {
        return String.naturalOrderComparator(left._descriptor.name, right._descriptor.name);
    }

    InspectorTest.addResult("Loaded modules:");
    var modules = self.runtime._modules;
    modules.sort(moduleSorter);
    for (var i = 0; i < modules.length; ++i) {
        if (modules[i]._loaded)
            InspectorTest.addResult("    " + modules[i]._descriptor.name);
    }
    if (next)
        next();
}

InspectorTest.TimeoutMock = function()
{
    this._timeoutId = 0;
    this._timeoutIdToProcess = {};
    this._timeoutIdToMillis = {};
    this.setTimeout = this.setTimeout.bind(this);
    this.clearTimeout = this.clearTimeout.bind(this);
}
InspectorTest.TimeoutMock.prototype = {
    setTimeout: function(operation, timeout)
    {
        this._timeoutIdToProcess[++this._timeoutId] = operation;
        this._timeoutIdToMillis[this._timeoutId] = timeout;
        return this._timeoutId;
    },

    clearTimeout: function(timeoutId)
    {
        delete this._timeoutIdToProcess[timeoutId];
        delete this._timeoutIdToMillis[timeoutId];
    },

    activeTimersTimeouts: function()
    {
        return Object.values(this._timeoutIdToMillis);
    },

    fireAllTimers: function()
    {
        for (var timeoutId in this._timeoutIdToProcess)
            this._timeoutIdToProcess[timeoutId].call(window);
        this._timeoutIdToProcess = {};
        this._timeoutIdToMillis = {};
    }
}

WebInspector.TempFile = InspectorTest.TempFileMock;

WebInspector.targetManager.observeTargets({
    targetAdded: function(target)
    {
        if (!WebInspector.domModel)
            WebInspector.domModel = target.domModel;
        if (!WebInspector.consoleModel)
            WebInspector.consoleModel = target.consoleModel;
        if (!WebInspector.networkManager)
            WebInspector.networkManager = target.networkManager;
        if (!WebInspector.timelineManager)
            WebInspector.timelineManager = target.timelineManager;
    },

    targetRemoved: function(target) { }
});

};  // initialize_InspectorTest

var initializeCallId = 0;
var runTestCallId = 1;
var completeTestCallId = 2;
var evalCallbackCallId = 3;
var frontendReopeningCount = 0;

function reopenFrontend()
{
    closeFrontend(openFrontendAndIncrement);
}

function closeFrontend(callback)
{
    // Do this asynchronously to allow InspectorBackendDispatcher to send response
    // back to the frontend before it's destroyed.
    setTimeout(function() {
        testRunner.closeWebInspector();
        callback();
    }, 0);
}

function openFrontendAndIncrement()
{
    frontendReopeningCount++;
    testRunner.showWebInspector();
    setTimeout(runTest, 0);
}

function runAfterIframeIsLoaded()
{
    if (window.testRunner)
        testRunner.waitUntilDone();
    function step()
    {
        if (!window.iframeLoaded)
            setTimeout(step, 100);
        else
            runTest();
    }
    setTimeout(step, 100);
}

function runTest(enableWatchDogWhileDebugging)
{
    if (!window.testRunner)
        return;

    testRunner.dumpAsText();
    testRunner.waitUntilDone();

    function initializeFrontend(initializationFunctions)
    {
        if (window.InspectorTest) {
            InspectorTest.pageLoaded();
            return;
        }

        InspectorTest = {};
    
        for (var i = 0; i < initializationFunctions.length; ++i) {
            try {
                initializationFunctions[i]();
            } catch (e) {
                console.error("Exception in test initialization: " + e);
                InspectorTest.completeTest();
            }
        }
    }

    function runTestInFrontend(testFunction, completeTestCallId)
    {
        if (InspectorTest.completeTestCallId) 
            return;

        InspectorTest.completeTestCallId = completeTestCallId;

        try {
            testFunction();
        } catch (e) {
            console.error("Exception during test execution: " + e,  (e.stack ? e.stack : "") );
            InspectorTest.completeTest();
        }
    }

    var initializationFunctions = [ String(initialize_InspectorTest) ];
    for (var name in window) {
        if (name.indexOf("initialize_") === 0 && typeof window[name] === "function" && name !== "initialize_InspectorTest")
            initializationFunctions.push(window[name].toString());
    }
    var parameters = ["[" + initializationFunctions + "]"];
    var toEvaluate = "(" + initializeFrontend + ")(" + parameters.join(", ") + ");";
    testRunner.evaluateInWebInspector(initializeCallId, toEvaluate);

    parameters = [test, completeTestCallId];
    toEvaluate = "(" + runTestInFrontend + ")(" + parameters.join(", ") + ");";
    testRunner.evaluateInWebInspector(runTestCallId, toEvaluate);

    if (enableWatchDogWhileDebugging) {
        function watchDog()
        {
            console.log("Internal watchdog triggered at 20 seconds. Test timed out.");
            closeInspectorAndNotifyDone();
        }
        window._watchDogTimer = setTimeout(watchDog, 20000);
    }
}

function runTestAfterDisplay(enableWatchDogWhileDebugging)
{
    if (!window.testRunner)
        return;

    testRunner.waitUntilDone();
    requestAnimationFrame(runTest.bind(this, enableWatchDogWhileDebugging));
}

function didEvaluateForTestInFrontend(callId)
{
    if (callId !== completeTestCallId)
        return;
    delete window.completeTestCallId;
    if (outputElement && window.quietUntilDone)
        outputElementParent.appendChild(outputElement);
    closeInspectorAndNotifyDone();
}

function closeInspectorAndNotifyDone()
{
    if (window._watchDogTimer)
        clearTimeout(window._watchDogTimer);

    testRunner.closeWebInspector();
    setTimeout(function() {
        testRunner.notifyDone();
    }, 0);
}

var outputElement;
var outputElementParent;
var savedOutput;

function createOutputElement()
{
    var intermediate = document.createElement("div");
    document.body.appendChild(intermediate);

    outputElementParent = document.createElement("div");
    intermediate.appendChild(outputElementParent);

    outputElement = document.createElement("div");
    outputElement.className = "output";
    outputElement.id = "output";
    outputElement.style.whiteSpace = "pre";
    if (!window.quietUntilDone)
        outputElementParent.appendChild(outputElement);
}

function output(text)
{
    if (!outputElement)
        createOutputElement();
    outputElement.appendChild(document.createTextNode(text));
    outputElement.appendChild(document.createElement("br"));
}

function clearOutput()
{
    if (outputElement) {
        outputElement.remove();
        outputElement = null;
    }
}

function saveOutput()
{
    savedOutput = outputElement ? outputElement.innerHTML : "";
}

function restoreOutput()
{
    if (!savedOutput)
        return;
    createOutputElement();
    outputElement.innerHTML = savedOutput;
}

function StandaloneTestRunnerStub()
{
}

StandaloneTestRunnerStub.prototype = {
    dumpAsText: function()
    {
    },

    waitUntilDone: function()
    {
    },

    closeWebInspector: function()
    {
        window.opener.postMessage(["closeWebInspector"], "*");
    },

    notifyDone: function()
    {
        var actual = document.body.innerText + "\n";
        window.opener.postMessage(["notifyDone", actual], "*");
    },

    evaluateInWebInspector: function(callId, script)
    {
        window.opener.postMessage(["evaluateInWebInspector", callId, script], "*");
    },

    display: function() { }
}

if (!window.testRunner && window.opener)
    window.testRunner = new StandaloneTestRunnerStub();
