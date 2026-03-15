async function run() {
    const curlCss = await (await fetch("https://fonts.googleapis.com/css2?family=Montserrat:wght@700&display=swap")).text()
    console.log("--- NO HEADERS ---")
    console.log(curlCss.slice(0, 500))

    const ieCss = await (await fetch("https://fonts.googleapis.com/css2?family=Montserrat:wght@700&display=swap", {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko" }
    })).text()
    console.log("--- IE11 HEADERS (WOFF) ---")
    console.log(ieCss.slice(0, 500))
}
run()
