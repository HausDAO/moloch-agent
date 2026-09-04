import { z } from 'zod';
const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
export function createServiceClient(config) {
    const base = config.serviceUrl;
    const chainId = config.chainId;
    return {
        health: () => getJson(`${base}/health`),
        capabilities: () => getJson(`${base}/capabilities`),
        dao: ({ dao }) => getJson(`${base}/dao/${chainId}/${normalizeDao(dao)}`),
        proposals: ({ dao, first, skip }) => getJson(`${base}/dao/${chainId}/${normalizeDao(dao)}/proposals?first=${first}&skip=${skip}`),
        proposal: ({ dao, proposal }) => getJson(`${base}/dao/${chainId}/${normalizeDao(dao)}/proposals/${proposal}`),
        members: ({ dao, first, skip }) => getJson(`${base}/dao/${chainId}/${normalizeDao(dao)}/members?first=${first}&skip=${skip}`),
        records: ({ dao, table, first, skip }) => getJson(`${base}/dao/${chainId}/${normalizeDao(dao)}/records?table=${encodeURIComponent(table)}&first=${first}&skip=${skip}`),
        pinJson: ({ name, data }) => postJson(`${base}/pin/json`, { name, data }),
    };
}
async function getJson(url) {
    const response = await fetch(url);
    return parseResponse(response);
}
async function postJson(url, body) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
    });
    return parseResponse(response);
}
async function parseResponse(response) {
    const text = await response.text();
    const body = text ? JSON.parse(text) : null;
    if (!response.ok) {
        const error = typeof body === 'object' && body && 'error' in body ? String(body.error) : response.statusText;
        throw new Error(error);
    }
    return body;
}
function normalizeDao(value) {
    return addressSchema.parse(value).toLowerCase();
}
