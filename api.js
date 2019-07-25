const request = require("request-promise");
const cron = require("node-cron")
const config = require("./config.json");

function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

class ApiFT {
    constructor(uid, secret) {
        this.uid = uid;
        this.secret = secret;
        this.users = [];
        this.allusers = [];
        this.examUsers = [];

        // setup cron schedule to get new users every 10 minutes
        const schedule = cron.schedule('*/10 * * * *', async () => {
            const token = await this.getToken();
            await sleep(1000);
            await this.getPiscineUsers(token);
            await sleep(1000);
            await this.getAllPiscineUsers(token);
            await sleep(1000);
            await this.getFinalExamUsers(token);
        });
        this.init();
    }

    // gets initial data
    async init() {
        const token = await this.getToken();
        await sleep(1000);
        await this.getFinalExamUsers(token);
        await sleep(1000);
        await this.getPiscineUsers(token);
        await sleep(1000);
        await this.getAllPiscineUsers(token);
    }

    // gets oauth access token
    async getToken() {
        const res = await request.post({
            url: "https://api.intra.42.fr/oauth/token",
            body: `grant_type=client_credentials&client_id=${this.uid}&client_secret=${this.secret}`
        });
        const obj = JSON.parse(res);
        return (obj.access_token);
    }

    // gets piscine users from 42 api
    async getPiscineUsers(token) {
        let output = [];
        const response = await request.get({
            url: `https://api.intra.42.fr/v2/cursus/piscine-c/cursus_users?filter[campus_id]=${config.campus_id}&filter[active]=true&filter[end_at]=${config.end_at}&filter[begin_at]=${config.begin_at}&page[size]=100`,
            auth: {
                bearer: token
            },
            resolveWithFullResponse: true
        });
        output = output.concat(JSON.parse(response.body));
        const pages = parseInt(response.headers["x-total"]);
        const amountpages = (Math.floor(pages / 100) + 1);
        await sleep(1000);
        for (let i = 1; i < amountpages; i++) {
            let res = await request.get({
                url: `https://api.intra.42.fr/v2/cursus/piscine-c/cursus_users?filter[campus_id]=${config.campus_id}&filter[active]=true&filter[end_at]=${config.end_at}&filter[begin_at]=${config.begin_at}&page[size]=100&page[number]=${i + 1}`,
                auth: {
                    bearer: token
                }
            });
            await sleep(1000);
            output = output.concat(JSON.parse(res));
        }
        this.users = output;
        return output;
    }

    async getAllPiscineUsers(token) {
        let output = [];
        const response = await request.get({
            url: `https://api.intra.42.fr/v2/cursus/piscine-c/cursus_users?filter[campus_id]=${config.campus_id}&page[size]=100`,
            auth: {
                bearer: token
            },
            resolveWithFullResponse: true
        });
        output = output.concat(JSON.parse(response.body));
        const pages = parseInt(response.headers["x-total"]);
        const amountpages = (Math.floor(pages / 100) + 1);
        await sleep(1000);
        for (let i = 1; i < amountpages; i++) {
            let res = await request.get({
                url: `https://api.intra.42.fr/v2/cursus/piscine-c/cursus_users?filter[campus_id]=${config.campus_id}&page[size]=100&page[number]=${i + 1}`,
                auth: {
                    bearer: token
                }
            });
            await sleep(1000);
            output = output.concat(JSON.parse(res));
        }
        this.allusers = output;
        return output;
    }

    async getFinalExamUsers(token) {
        let output = [];

        const response = await request.get({
            url: `https://api.intra.42.fr/v2/projects/${config.final_exam}/projects_users?filter[campus]=${config.campus_id}&page[size]=100`,
            auth: {
                bearer: token
            },
            resolveWithFullResponse: true
        });
        output = output.concat(JSON.parse(response.body));
        const pages = parseInt(response.headers["x-total"]);
        const amountpages = (Math.floor(pages / 100) + 1);
        await sleep(1000);
        for (let i = 1; i < amountpages; i++) {
            let res = await request.get({
                url: `https://api.intra.42.fr/v2/projects/${config.final_exam}/projects_users?filter[campus]=${config.campus_id}&page[size]=100&page[number]=${i + 1}`,
                auth: {
                    bearer: token
                }
            });
            await sleep(1000);
            output = output.concat(JSON.parse(res));
        }
        this.examUsers = output;
        return output;
    }

    // sorts array of users by level
    sortUsers(users)
    {
        return users.sort((a, b) => b.level - a.level);
    }

    // sorts array of users by mark
    sortMarkUsers(users)
    {
        return users.sort((a, b) => b.final_mark - a.final_mark);
    }

    addIndicator(users)
    {
        for (let i in users)
        {
            if (users[i].begin_at == config.begin_at && users[i].end_at == config.end_at)
                users[i].current_piscine = true;
            else
                users[i].current_piscine = false;
        }
        return (users);
    }
    // gets cached users
    getUsers() {
        return this.sortUsers(this.users);
    }

    // gets cached users from every piscine
    getAllUsers() {
        return this.addIndicator(this.sortUsers(this.allusers));
    }

    // gets cached exam users for every piscine
    getExamUsers() {
        return this.sortMarkUsers(this.examUsers);
    }
}

module.exports = ApiFT;