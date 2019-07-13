const request = require("request-promise");
const cron = require("node-cron")
const config = require("./config.json");

class ApiFT {
    constructor(uid, secret) {
        this.uid = uid;
        this.secret = secret;
        this.users = [];

        // setup cron schedule to get new users every 5 minutes
        const schedule = cron.schedule('*/5 * * * *', async () => {
            const token = await this.getToken();
            await this.getPiscineUsers(token);
        });
        this.init();
    }

    // gets initial data
    async init() {
        const token = await this.getToken();
        await this.getPiscineUsers(token);
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
        for (let i = 1; i < amountpages; i++) {
            let res = await request.get({
                url: `https://api.intra.42.fr/v2/cursus/piscine-c/cursus_users?filter[campus_id]=${config.campus_id}&filter[active]=true&filter[end_at]=${config.end_at}&filter[begin_at]=${config.begin_at}&page[size]=100&page[number]=${i + 1}`,
                auth: {
                    bearer: token
                }
            });
            output = output.concat(JSON.parse(res));
        }
        this.users = output;
        return output;
    }

    // sorts array of users by level
    sortUsers(users)
    {
        return users.sort((a, b) => b.level - a.level);
    }

    // gets cached users
    getUsers() {
        return this.sortUsers(this.users);
    }
}

module.exports = ApiFT;