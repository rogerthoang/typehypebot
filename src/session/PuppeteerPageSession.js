'use strict';

const Utils = require('../util/Utils');
const puppeteer = require('puppeteer');

/**
 * @module ChromelessSession
 */
module.exports = class PuppeteerPageSession{
    static async createPuppeteerPageSession(page){
        return new PuppeteerPageSession(page, Utils.getRandomUserAgent(), await page.cookies());
    }
    /**
     * @param {puppeteer.Page} page
     * @param {String} userAgent
     * @param {Object} cookies
     */
    constructor(page, userAgent, cookies){
        this.page = page;
        this.userAgent = userAgent;
        this.lastCookies = cookies;
        this.lastContent = '';
    }
    async goto(url, options = {}){
        await this.page.deleteCookie(...await this.page.cookies());
        await this.page.setUserAgent(this.userAgent);
        await this.page.setCookie(...this.lastCookies);
        try{
            const goto = await this.page.goto(url, options);
            this.lastCookies = await this.page.cookies();
            this.lastContent = await this.page.content();
            return goto;
        }catch(error){
            throw error;
        }
    }
    deleteCookies(){
        this.lastCookies = [];
    }
    content(){
        return this.lastContent;
    }
    cookies(){
        return this.lastCookies;
    }
};
