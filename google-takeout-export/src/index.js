const fs = require("fs");

const puppeteer = require("puppeteer-extra")
const pluginStealth = require("puppeteer-extra-plugin-stealth")
puppeteer.use(pluginStealth())
const devtools = require('puppeteer-extra-plugin-devtools')()
puppeteer.use(devtools)
puppeteer.use(require('puppeteer-extra-plugin-repl')())

let authenticator = require('authenticator');


const secretsFile = "/run/build/secrets/secrets";
const secrets = JSON.parse(fs.readFileSync(secretsFile, 'utf8'));
const username = secrets.USERNAME;
const password = secrets.PASSWORD;
const mfaToken = secrets.MFA_TOKEN;

// const launchArgs = ['--no-sandbox', '--disable-setuid-sandbox', '--proxy-server=zproxy.lum-superproxy.io:22225']
const launchArgs = ['--no-sandbox', '--disable-setuid-sandbox']
puppeteer.launch({ headless: true, args: launchArgs}).then(async browser => {
    console.log('launched')

    // Set up browser tunnel
    const browserCtx = await browser.createIncognitoBrowserContext();
    const tunnel = await devtools.createTunnel(browser)
    console.log(tunnel.url)

    const page = await browserCtx.newPage();

    // Set up luminati proxy
    await page.authenticate({
        username: '',
        password: ''
    });
    // await page.goto('http://lumtest.com/myip.json');
    // await page.repl()
    // await browser.repl()
    // await browser.close();
    // process.exit()


    // TODO: URL shortcut
    // https://takeout.google.com/takeout/custom/mymaps,local_actions,location_history
    await page.goto('https://takeout.google.com/settings/takeout', {waitUntil: 'networkidle2'});
    // await page.waitFor(20000)
    console.log("FINISHED WAITING")

    console.log('waiting for email input')
    const emailInputSelector = 'input[type=email]'
    await page.waitForSelector(emailInputSelector, {visible: true})
    console.log('found email')
    // Type in email
    await page.type(emailInputSelector, username, {delay: 20})

    // Submit email
    page.click('div[data-primary-action-label="Next"] button')
    console.log('submitted email')

    console.log('waiting for pass input')
    const passwordSelector = 'input[type=password]'
    await page.waitForSelector(passwordSelector, {visible: true})
    console.log('found pass input')
    // Type in password
    await page.type(passwordSelector, password, {delay: 20})
    // Submit password
    page.click('div[data-primary-action-label="Next"] button')
    console.log('submitted pass')

    try {
        console.log('waiting for mfa chooser button')
        const mfaChooserSelector = 'div[data-primary-action-label=""] button'
        await page.waitForSelector(mfaChooserSelector, {visible: true, timeout: 10000})
        await page.waitForTimeout(1000)
        console.log('found mfa chooser button')
        // Choose different MFA method
        page.click(mfaChooserSelector)
        console.log('submitted mfa chooser')
    } catch (e) {
        console.log(e)
        console.log("skipping to mfa choose button")
    }

    console.log('waiting for mfa method list')
    await page.waitForTimeout(1000)
    const mfaMethodSelector = 'div[data-form-action-uri] li div[data-challengetype="6"]'
    await page.waitForSelector(mfaMethodSelector, {visible: true})
    // TODO: Hack because for some reason the above selector resolves before the element is clickable
    await page.waitForTimeout(1000)
    console.log('found found mfa method list')
    // Select Google Authenticator MFA method
    page.click(mfaMethodSelector)
    console.log('submitted mfa method')

    console.log('waiting for mfa token input')
    const mfaTokenInputSelector = 'input[aria-label="Enter code"]'
    await page.waitForSelector(mfaTokenInputSelector, {visible: true})
    console.log('found mfa token input')
    // Generate token and enter it into input field
    const formattedToken = authenticator.generateToken(mfaToken);
    await page.type(mfaTokenInputSelector, formattedToken, {delay: 20})
    // Submit token
    const mfaTokenButtonSelector = 'div[data-primary-action-label="Next"] button'
    await page.waitForSelector(mfaTokenButtonSelector, {visible: true})
    await page.waitForTimeout(1000)
    page.click(mfaTokenButtonSelector)
    console.log('submitted mfa token')

    console.log('waiting for deselect all button')
    const deselectAllSelector = 'button[aria-label="Deselect all"]'
    await page.waitForSelector(deselectAllSelector, {visible: true})
    console.log('found deselect all button')
    // Deselect all products
    page.click(deselectAllSelector)
    console.log('selected deselect all')

    // Select Google Tasks product
    const googleTasksSelector = 'div[data-id="tasks"] input[aria-label="Select Tasks"]'
    await page.waitForSelector(googleTasksSelector, {visible: true})
    await page.waitForTimeout(1000)
    page.click(googleTasksSelector)
    console.log('selected Google Tasks')

    // Go to next step of data export wizard
    console.log('waiting for submit next step')
    const submitNextStep = 'button[aria-label="Next step"]:not([disabled])'
    await page.waitForSelector(submitNextStep, {visible: true})
    page.click(submitNextStep)
    console.log('submitted to next step')


    // Click on delivery method dropdown
    console.log('waiting for delivery method dropdown')
    const destinationDropdownSelector = 'div[role="listbox"][data-param="destination"]'
    await page.waitForSelector(destinationDropdownSelector, {visible: true})
    await page.waitForTimeout(1000)
    page.click(destinationDropdownSelector)
    await page.waitForTimeout(1000)
    // TODO: This doesn't work because after opening the drpodown it says the "drive" element isn't visible
    //await page.click('div[role="listbox"][data-param="destination"] div[data-value="DRIVE"]')
    // Click down and enter to select the second element which is the Google Drive export option
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(500)
    await page.keyboard.press('Enter')
    // Stop if drive was not selected. Better way to do this?
    const driveDestinationSelectedSelector = 'div[role="listbox"][data-param="destination"] div[data-value="DRIVE"][aria-selected="true"]'
    await page.waitForSelector(driveDestinationSelectedSelector, {visible: true})
    console.log('selected delivery method')

    // Click on delivery frequency
    console.log('waiting for delivery frequency radio')
    const deliveryFrequencyRadioSelector = 'input[name="scheduleoptions"][value="1"]'
    await page.waitForSelector(deliveryFrequencyRadioSelector, {visible: true})
    page.click(deliveryFrequencyRadioSelector)
    console.log('selected delivery frequency')

    // Click on file type dropdown
    console.log('waiting for delivery format dropdown')
    const deliveryFormatDropdownSelector = 'div[role="listbox"][data-param="format"]'
    await page.waitForSelector(deliveryFormatDropdownSelector, {visible: true})
    await page.waitForTimeout(1000)
    page.click(deliveryFormatDropdownSelector)
    await page.waitForTimeout(500)
    // TODO: This doesn't work because after opening the drpodown it says the "TGZ" element isn't visible
    // await page.click('div[role="listbox"][data-param="format"] div[data-value="TGZ"]')
    // TODO: Hack due to above not working
    // Click down and enter to select the file type as TGZ
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(500)
    await page.keyboard.press('Enter')
    console.log('selected delivery file format')

    // Click on file size dropdown
    console.log('waiting for file size dropdown')
    const fileSizeDropdownSelector = 'div[role="listbox"][data-param="size"]'
    await page.waitForSelector(fileSizeDropdownSelector, {visible: true})
    await page.waitForTimeout(1000)
    page.click(fileSizeDropdownSelector)
    await page.waitForTimeout(1000)
    // TODO: This doesn't work because after opening the drpodown it says the "50GB" element isn't visible
    // await page.click('div[role="listbox"][data-param="size"] div[data-value="53687091200"]')
    // TODO: Hack due to above not working
    // Click down (more times than necessary) to select the largest size then enter to select "50GB"
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(500)
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(500)
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(500)
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(500)
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(500)
    await page.keyboard.press('Enter')
    console.log('selected delivery max size per file')

    // Click on "Create export" button
    page.click('c-wiz[data-state="1"] div[role="tabpanel"] button')
    console.log('submitted create export request')

    // await page.repl()
    // await browser.repl()

    // TODO: It appears that in aws (or behind even attemted residential proxies) google doesn't allow for
    // TODO:    token authentication and is thus not possible to be automated. The only work around here is
    // TODO:    to figure out why google is becoming suspicious of this activity and work around it. Another
    // TODO:    possible option is to leave a persistent session open. Once a session has successfully submitted
    // TODO:    an export the subsequent exports don't seem to be suspect by google and submit without requiring
    // TODO:    verification.
    try {
        console.log('waiting for mfa chooser button')
        const verifyMfaChooserSelector = 'div[data-primary-action-label="Yes"] div div:nth-child(2) button'
        await page.waitForSelector(verifyMfaChooserSelector, {visible: true, timeout: 10000})
        await page.waitForTimeout(1000)
        console.log('found mfa chooser button')
        // Choose different MFA method
        page.click(verifyMfaChooserSelector)
        console.log('submitted mfa chooser')

        console.log('waiting for mfa method list')
        await page.waitForTimeout(1000)
        const mfaMethodSelector = 'div[data-form-action-uri] li div[data-challengetype="6"]'
        await page.waitForSelector(mfaMethodSelector, {visible: true})
        // TODO: Hack because for some reason the above selector resolves before the element is clickable
        await page.waitForTimeout(1000)
        console.log('found found mfa method list')
        // Select Google Authenticator MFA method
        page.click(mfaMethodSelector)
        console.log('submitted mfa method')

        console.log('waiting for mfa token input')
        const mfaTokenInputSelector = 'input[aria-label="Enter code"]'
        await page.waitForSelector(mfaTokenInputSelector, {visible: true})
        console.log('found mfa token input')
        // Generate token and enter it into input field
        const formattedToken = authenticator.generateToken(mfaToken);
        await page.type(mfaTokenInputSelector, formattedToken, {delay: 20})
        // Submit token
        const mfaTokenButtonSelector = 'div[data-primary-action-label="Next"] button'
        await page.waitForSelector(mfaTokenButtonSelector, {visible: true})
        await page.waitForTimeout(1000)
        page.click(mfaTokenButtonSelector)
        console.log('submitted mfa token')
    } catch (e) {
        console.log(e)
        console.log("skipping to export validation")
    }


    console.log("validating export...")
    await page.waitForTimeout(3000)
    await page.waitForSelector('title')
    await page.waitForTimeout(1000)
    let title = await page.title();
    if (title !== 'Manage your exports') {
        console.log('Title was: ' + title)
        throw 'Export failed'
    }

    // TODO: This might not always be necessary? Maybe put it in a try/catch? Or check if elements exist/title of page
    // Type in password
    // await page.type('input[type=password]', '***REMOVED***', {delay: 20})
    // Submit password
    // page.click('div[data-primary-action-label="Next"] button')


    console.log("Export successful")
    // await page.repl()
    // await browser.repl()
    process.exit()
}).catch(e => {
    console.log("Fail")
    console.log(e);
    process.exit(1)
});

