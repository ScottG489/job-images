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

    const browserCtx = await browser.createIncognitoBrowserContext();
    const page = await browserCtx.newPage();

    await setUpBrowserTunnel(browser);

    // Set up luminati proxy. You also need to change launch args
    // await page.authenticate({
    //     username: '',
    //     password: ''
    // });
    // await page.goto('http://lumtest.com/myip.json');
    // await page.repl()
    // await browser.repl()
    // await browser.close();
    // process.exit()


    // See bottom of file for all takeout product id's
    await page.goto('https://takeout.google.com/takeout/custom/tasks', {waitUntil: 'networkidle2'});
    // await page.waitFor(20000)
    console.log("FINISHED WAITING")

    console.log('----------Start login process----------')
    console.log('-----Submit email-----')
    await typeEmail(page);
    clickSubmitEmail(page);
    console.log('-----Submit password-----')
    await typePassword(page);
    clickSubmitPassword(page);

    console.log('-----Submit MFA token code-----')
    // I think this catch is here for when there are too many "failed" login attempts. Google seems to consider
    //   them failures even though I successfully logged in with the alternate MFA method. I believe this will
    //   happen when this export script is run too many times in quick succession.
    try {
        await clickMfaChooser(page);
    } catch (e) {
        console.log(e)
        console.log('**********ACCOUNT HAS BEEN SOFT LOCKED**********')
        console.log("*****This means you've had too many 'failed' login attempts in a certain amount of time*****")
        console.log("*****However, we're still able to use the Google Authenticator MFA method*****")
        console.log("*****Skipping to MFA method list*****")
    }

    await clickMfaMethodInList(page);
    await typeMfaCodeGeneratedFromToken(page);
    await clickSubmitTokenCode(page);

    console.log('----------Start Takeout export settings process----------')
    await clickSubmitNextStep(page);

    console.log('-----Select Delivery export method-----')
    console.log('Export method: Add to Google Drive')
    await clickDeliveryMethodDropdown(page);
    await selectGoogleDriveDeliveryMethod(page);

    console.log('-----Select Delivery frequency-----')
    console.log('Export frequency: Export once')
    await selectExportOnceDeliveryFrequency(page);

    console.log('-----Select file type-----')
    console.log('Export file type: TGZ')
    await clickFileTypeDropdown(page);
    await selectTgzFileType(page);

    console.log('-----Select max file size before split-----')
    console.log('Export file size: 50GB')
    await clickFileSizeDropdown(page);
    await select50GbFileSize(page);

    console.log('-----Submit export-----')
    clickSubmitExportButton(page);

    // await extraMfaAuthorizationAfterTakeoutExportSubmission(page);
    await validateExportSubmissionWasSuccessful(page);

    console.log("Export successful!")
    // await page.repl()
    // await browser.repl()
    process.exit()
}).catch(e => {
    console.log("Fail")
    console.log(e);
    process.exit(1)
});


async function setUpBrowserTunnel(browser) {
    devtools.setAuthCredentials('foo', 'bar')
    const tunnel = await devtools.createTunnel(browser)
    console.log(tunnel.url)
}

async function typeEmail(page) {
    const emailInputSelector = 'input[type=email]'

    console.log('Waiting for login email input')
    await page.waitForSelector(emailInputSelector, {visible: true})
    console.log('Found email input')

    console.log('Typing in login email')
    await page.type(emailInputSelector, username, {delay: 20})
}

function clickSubmitEmail(page) {
    console.log('Clicking button to submit login email')
    page.click('div[data-primary-action-label="Next"] button')
    console.log('Submitted login email')
}

async function typePassword(page) {
    const passwordSelector = 'input[type=password]'

    console.log('Waiting for login password input')
    await page.waitForSelector(passwordSelector, {visible: true})
    console.log('Found password input')

    console.log('Typing in login password')
    await page.type(passwordSelector, password, {delay: 20})
}

function clickSubmitPassword(page) {
    console.log('Clicking button to submit login password')
    page.click('div[data-primary-action-label="Next"] button')
    console.log('Submitted login password')
}

async function clickMfaChooser(page) {
    const mfaChooserSelector = 'div[data-primary-action-label=""] button'

    console.log('Waiting for MFA chooser button')
    await page.waitForSelector(mfaChooserSelector, {visible: true, timeout: 10000})
    await page.waitForTimeout(1000)
    console.log('Found MFA chooser button')

    console.log('Clicking opt for alternate MFA method button')
    page.click(mfaChooserSelector)
    console.log('Submitted opting for alternate MFA method')
}

async function clickMfaMethodInList(page) {
    const mfaMethodSelector = 'div[data-form-action-uri] li div[data-challengetype="6"]'

    console.log('Waiting for MFA method list')
    await page.waitForTimeout(1000)
    await page.waitForSelector(mfaMethodSelector, {visible: true})
    // TODO: Hack because for some reason the above selector resolves before the element is clickable
    await page.waitForTimeout(1000)
    console.log('Found MFA method list')

    console.log('Clicking Google Authenticator MFA method in MFA list')
    page.click(mfaMethodSelector)
    console.log('Submitted MFA method')
}

async function typeMfaCodeGeneratedFromToken(page) {
    const mfaTokenInputSelector = 'input[aria-label="Enter code"]'

    console.log('Waiting for MFA token code input')
    await page.waitForSelector(mfaTokenInputSelector, {visible: true})
    console.log('Found MFA token code input')

    console.log('Generating MFA code from token')
    const formattedToken = authenticator.generateToken(mfaToken);
    console.log('Generated MFA token code')

    console.log('Typing in MFA token code')
    await page.type(mfaTokenInputSelector, formattedToken, {delay: 20})
}

async function clickSubmitTokenCode(page) {
    const mfaTokenButtonSelector = 'div[data-primary-action-label="Next"] button'

    console.log('Waiting for MFA token code submit button')
    await page.waitForSelector(mfaTokenButtonSelector, {visible: true})
    await page.waitForTimeout(1000)
    console.log('Found MFA token code submit button')

    console.log('Clicking button to submit token code for MFA')
    page.click(mfaTokenButtonSelector)
    console.log('Submitted token code for MFA')
}

async function clickSubmitNextStep(page) {
    // Go to next step of data export wizard
    const submitNextStep = 'button[aria-label="Next step"]:not([disabled])'

    console.log('Waiting for next step of export settings button')
    await page.waitForSelector(submitNextStep, {visible: true})
    console.log('Found next step of export settings button')

    console.log('Clicking next step of export settings button')
    page.click(submitNextStep)
    console.log('Clicked next step of export settings button')
}

async function clickDeliveryMethodDropdown(page) {
    // Click on delivery method dropdown
    const destinationDropdownSelector = 'div[role="listbox"][data-param="destination"]'

    console.log('Waiting for delivery method dropdown')
    await page.waitForSelector(destinationDropdownSelector, {visible: true})
    await page.waitForTimeout(1000)
    console.log('Found delivery method dropdown')

    console.log('Clicking on delivery method dropdown')
    page.click(destinationDropdownSelector)
    await page.waitForTimeout(1000)
    console.log('Clicked on delivery method dropdown')
}

async function selectGoogleDriveDeliveryMethod(page) {
    // TODO: This doesn't work because after opening the dropdown it says the "drive" element isn't visible
    //await page.click('div[role="listbox"][data-param="destination"] div[data-value="DRIVE"]')

    console.log('Pressing down arrow once to get to Google Drive delivery method dropdown item')
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(500)
    console.log('Pressing enter to select Google Drive delivery method dropdown item')
    await page.keyboard.press('Enter')

    // Stop if drive was not selected. Better way to do this?
    const driveDestinationSelectedSelector = 'div[role="listbox"][data-param="destination"] div[data-value="DRIVE"][aria-selected="true"]'
    console.log("Verifying Google Drive delivery method was selected")
    await page.waitForSelector(driveDestinationSelectedSelector, {visible: true})
    console.log("Verified Google Drive delivery method was selected")
}

async function selectExportOnceDeliveryFrequency(page) {
    const deliveryFrequencyRadioSelector = 'input[name="scheduleoptions"][value="1"]'

    console.log('Waiting for delivery frequency radio input')
    await page.waitForSelector(deliveryFrequencyRadioSelector, {visible: true})
    console.log('Found delivery frequency radio input')

    console.log('Clicking on export once delivery frequency radio input')
    page.click(deliveryFrequencyRadioSelector)
    console.log('Selected export once delivery frequency radio input')
}

async function clickFileTypeDropdown(page) {
    const deliveryFormatDropdownSelector = 'div[role="listbox"][data-param="format"]'

    console.log('Waiting for delivery format dropdown')
    await page.waitForSelector(deliveryFormatDropdownSelector, {visible: true})
    await page.waitForTimeout(1000)
    console.log('Found delivery format dropdown')

    console.log('Clicking on delivery format dropdown')
    page.click(deliveryFormatDropdownSelector)
    await page.waitForTimeout(500)
    console.log('Clicked on delivery format dropdown')
}

async function selectTgzFileType(page) {
    // TODO: This doesn't work because after opening the drpodown it says the "TGZ" element isn't visible
    // await page.click('div[role="listbox"][data-param="format"] div[data-value="TGZ"]')

    // TODO: Hack due to above not working
    // Click down and enter to select the file type as TGZ
    console.log('Pressing down arrow once to get to TGZ file type dropdown item')
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(500)

    console.log('Pressing enter to select TGZ file type dropdown item')
    await page.keyboard.press('Enter')
}

async function clickFileSizeDropdown(page) {
    console.log('Waiting for file size dropdown')
    const fileSizeDropdownSelector = 'div[role="listbox"][data-param="size"]'
    await page.waitForSelector(fileSizeDropdownSelector, {visible: true})
    await page.waitForTimeout(1000)
    console.log('Found file size dropdown')

    console.log('Clicking on file size dropdown')
    page.click(fileSizeDropdownSelector)
    await page.waitForTimeout(1000)
}

async function select50GbFileSize(page) {
    // TODO: This doesn't work because after opening the drpodown it says the "50GB" element isn't visible
    // await page.click('div[role="listbox"][data-param="size"] div[data-value="53687091200"]')
    // TODO: Hack due to above not working
    // Click down (more times than necessary) to select the largest size then enter to select "50GB"
    console.log('Pressing down arrow 5 times to guarantee we are on the 50GB file size option')
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

    console.log('Pressing enter to select 50GB file size dropdown item')
    await page.keyboard.press('Enter')
}

function clickSubmitExportButton(page) {
    console.log('Clicking create export button')
    page.click('c-wiz[data-state="1"] div[role="tabpanel"] button')
    console.log('Submitted Google Takeout create export request')
}

async function extraMfaAuthorizationAfterTakeoutExportSubmission(page) {
    // TODO: It appears that in aws (or behind even attempted residential proxies) google doesn't allow for
    // TODO:    token authentication and is thus not possible to be automated. The only work around here is
    // TODO:    to figure out why google is becoming suspicious of this activity and work around it.
    // TODO: Another possible option is to leave a persistent session open. Once a session has successfully
    // TODO:   submitted an export the subsequent exports don't seem to be suspect by google and submit
    // TODO:   without requiring verification.
    // TODO: That said, I'm not exactly sure when this code would run. Perhaps after we've created a persistent
    // TODO:   session while running in AWS? Even then I would imagine it wouldn't have any extra verification
    // TODO:   after we've submitted the export. In any case, I'm leaving this here for now in case I decide
    // TODO:   to go down the persistent session route in the future and it ends up being useful.
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
}

async function validateExportSubmissionWasSuccessful(page) {
    console.log("Validating export...")
    await page.waitForTimeout(3000)
    await page.waitForSelector('title')
    await page.waitForTimeout(1000)

    let expectedTitle = 'Manage your exports';
    let title = await page.title();
    if (title !== expectedTitle) {
        console.log('Expected title: ' + expectedTitle)
        console.log('Title was: ' + title)
        throw 'Export failed!'
    }
}


// List of all services and their corresponding id. The id's can be use like so:
// https://takeout.google.com/takeout/custom/mymaps,local_actions,location_history

// Android Device Configuration Service: checkin
// Arts & Culture: arts_and_culture
// Assistant Notes and Lists: assistant_notes_and_lists
// Blogger: blogger
// Calendar: calendar
// Chrome: chrome
// Classic Sites: classic_sites
// Classroom: classroom
// Cloud Print: cloud_print
// Contacts: contacts
// Crisis User Reports: crisis_ugc
// Data Shared for Research: data_shared_for_research
// Drive: drive
// Fit: fit
// Google Account: google_account
// Google Fi: fi
// Google Help Communities: support_content
// Google My Business: my_business
// Google Pay: google_pay
// Google Photos: plus_photos
// Google Play Books: books
// Google Play Games Services: play_games_services
// Google Play Movies & TV: play_movies
// Google Play Music: play_music
// Google Play Store: play
// Google Shopping: shopping
// Google Store: google_store
// Google Translator Toolkit: gtrans
// Google Workspace Marketplace: apps_marketplace
// Groups: groups
// Hangouts: chat
// Home App: home_graph
// Keep: keep
// Location History: location_history
// Mail: gmail
// Maps: maps
// Maps (your places): local_actions
// My Activity: my_activity
// My Maps: mymaps
// News: news
// Pinpoint: backlight
// Posts on Google: posts_on_google
// Profile: profile
// Purchases & Reservations: my_orders
// Question Hub: question_hub
// Reminders: reminders
// Saved: save
// Search Contributions: search_ugc
// Shopping Lists: shopping_list
// Street View: streetview
// Tasks: tasks
// Voice: voice
// YouTube and YouTube Music: youtube
