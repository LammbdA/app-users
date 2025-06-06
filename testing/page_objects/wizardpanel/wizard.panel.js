/**
 * Created on 5/30/2017.
 */
const Page = require('../page');
const lib = require('../../libs/elements');
const appConst = require('../../libs/app_const');
const {Key} = require('webdriverio');
const XPATH = {
    displayNameInput: `//input[contains(@name,'displayName')]`,
    saveButton: "//button[contains(@id,'ActionButton') and child::span[text()='Save']]",
    deleteButton: "//button[contains(@id,'ActionButton') and child::span[text()='Delete']]",
};

class WizardPanel extends Page {

    get displayNameInput() {
        return XPATH.displayNameInput;
    }

    get saveButton() {
        return XPATH.saveButton;
    }

    get deleteButton() {
        return XPATH.deleteButton;
    }

    async waitForSaveButtonEnabled() {
        try {
            return await this.waitForElementEnabled(this.saveButton, appConst.mediumTimeout);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_save_button');
            throw new Error(`Save button is not enabled:${screenshot} ` + err);
        }
    }

    isSaveButtonEnabled() {
        return this.isElementEnabled(this.saveButton);
    }

    waitForSaveButtonDisabled() {
        return this.waitForElementDisabled(this.saveButton, appConst.mediumTimeout);
    }

    waitForDeleteButtonDisabled() {
        return this.waitForElementDisabled(this.deleteButton, appConst.mediumTimeout);
    }

    async typeDisplayName(displayName) {
        try {
            await this.typeTextInInput(this.displayNameInput, displayName);
            await this.pause(500);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_displayName_input');
            throw new Error("Error during inserting the display name, screenshot: " + screenshot + '  ' + err);
        }
    }

    clearDisplayNameInput() {
        return this.clearInputText(this.displayNameInput);
    }

    isDisplayNameInputVisible() {
        return this.isElementDisplayed(this.displayNameInput);
    }

    async waitAndClickOnSave() {
        try {
            await this.waitForSaveButtonEnabled();
            await this.clickOnElement(this.saveButton);
            return await this.pause(700);
        } catch (err) {
            let screenshot = await this.saveScreenshotUniqueName('err_save_button');
            throw new Error(`Error occurred during clicking on Save button ! ${screenshot} ` + err);
        }
    }

    clickOnDeleteButton() {
        return this.clickOnElement(this.deleteButton).catch(err => {
            this.saveScreenshot('err_delete_wizard');
            throw new Error('Error when Delete button has been clicked ' + err);
        });
    }

    async isItemInvalid(displayName) {
        try {
            let selector = lib.tabItemByDisplayName(displayName);
            let result = await this.getAttribute(selector, 'class');
            return result.includes('invalid');
        } catch (err) {
            throw new Error('tabItem: ' + err);
        }
    }

    async waitUntilInvalidIconDisplayed(displayName) {
        let selector = lib.tabItemByDisplayName(displayName);
        return await this.browser.waitUntil(async () => {
            let result = await this.getAttribute(selector, 'class');
            return result.includes('invalid');
        }, {timeout: appConst.mediumTimeout, timeoutMsg: 'invalid-icon should be displayed in the wizard'});
    }

    waitUntilInvalidIconDisappears(displayName) {
        let selector = lib.tabItemByDisplayName(displayName);
        return this.getBrowser().waitUntil(() => {
            return this.getAttribute(selector, 'class').then(result => {
                return !result.includes('invalid');
            })
        }, {timeout: appConst.mediumTimeout, timeoutMsg: "Invalid icon should not be displayed", interval: 500});
    }

    async hotKeySave() {
        let status = await this.getBrowserStatus();
        if (status.os.name.includes('Mac')) {
            return await this.getBrowser().keys([Key.Command, 's']);
        } else {
            return await this.getBrowser().keys([Key.Ctrl, 's']);
        }
    }

    async hotKeyDelete() {
        let status = await this.getBrowserStatus();
        if (status.os.name.includes('Mac')) {
            return await this.getBrowser().keys([Key.Command, Key.Delete]);
        } else {
            return await this.getBrowser().keys([Key.Ctrl, Key.Delete]);
        }
    }
}

module.exports = {WizardPanel, XPATH};


