window.analytics = (() => {
    function initialize(remoteURL){
        let timeoutID;
        // ID for as long as tab is opened
        let id = crypto.randomUUID();

        function startTracking(){
            // Clear timeout (wait for N seconds before starting)
            clearTimeout(timeoutID);
            let start = new Date();

            document.addEventListener("visibilitychange", () => {
                if (document.visibilityState == "hidden"){
                    // Send event when tab gets hidden
                    sendEvent(new Date() - start)
                } else if (document.visibilityState == "visible"){
                    // Reset timer when tab is visible
                    start = new Date();
                }
            });

        }
        function sendEvent(timeSpent){
            let url = new URL(window.location.href);
            fetch(remoteURL, {
                body: JSON.stringify({
                    // id: id,
                    totalTimeOnPage: timeSpent,
                    currentTime: new Date().getTime(),
                    width: document.body.clientWidth,
                    height: document.body.clientHeight,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    userAgent: navigator.userAgent,
                    isMobile: navigator.userAgentData.mobile,
                    isTouchScreen: navigator.maxTouchPoints > 0,
                    referrer: document.referrer || null,
                    host: url.hostname,
                    port: url.port || null,
                    path: url.pathname
                }),
                method: "POST",
                keepalive: true,
                // CORS is ignored, since we don't need the response - only the error (logged in console)
                mode: "no-cors"
            })
        }
        timeoutID = setTimeout(startTracking, 2000); // sleep for 2 seconds
    }
    return {
        initialize: initialize
    }
})();