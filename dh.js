const axios = require('axios');
const _ = require('lodash');

async function getDNSRecords() {
    const API_KEY = process.env.DREAMHOST_API_KEY;
    const apiUrl = `https://api.dreamhost.com/?key=${API_KEY}&cmd=dns-list_records`;

    const response = await axios.get(apiUrl);
    const responseData = response.data.trim().split('\n');
    responseData.shift();
    const columnNames = responseData.shift().split('\t');

    const records = _.map(responseData, response => {
        const values = response.split('\t');
        return _.zipObject(columnNames, values);
    });


    return records;
}

async function addDnsRecord(domain, type, value, comment) {
    console.log("Adding record: ", domain, type, value, comment);
    const apiUrl = 'https://api.dreamhost.com/';
    const cmd = 'dns-add_record';

    const params = new URLSearchParams({
        key: process.env.DREAMHOST_API_KEY,
        cmd: cmd,
        comment,
        record: domain,
        type: type,
        value: value
    });

    await axios.get(apiUrl, { params });
}

async function removeDnsRecord(domain, type, value) {
    console.log("Removing record: ", domain, type, value);
    const apiUrl = 'https://api.dreamhost.com/';
    const cmd = 'dns-remove_record';

    const params = new URLSearchParams({
        key: process.env.DREAMHOST_API_KEY,
        cmd: cmd,
        record: domain,
        type: type,
        value: value
    });

    await axios.get(apiUrl, { params });
}

async function getExternalIpAddress() {
    const response = await axios.get('https://api.ipify.org?format=json');
    const ipAddress = response.data.ip;
    return ipAddress;
}

// Call the function and handle the result
async function main() {
    console.log("Running ip updater", new Date());
    const records = await getDNSRecords();
    const plex = _.find(records, {
        record: "plex.julianhartline.com"
    });

    if (!plex) throw new Error("No plex entry found");
    const external = await getExternalIpAddress();
    if (plex.value === external) {
        console.log(`Record matches external IP address! ${external}`);
        return;
    }

    await removeDnsRecord(plex.record, plex.type, plex.value);
    await addDnsRecord("plex.julianhartline.com", "A", external, "Treehouse");

}

main();
