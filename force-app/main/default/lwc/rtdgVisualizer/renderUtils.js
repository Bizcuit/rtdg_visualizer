/**
 * Utility functions for rendering different types of content in the RTDG Visualizer component
 */
 import getSegmentName from '@salesforce/apex/DataCloudSegmentHelper.getSegmentName';

const testConfig = [
    {
        "type": "attribute",
        "label": "First Name",
        "path": "ssot__FirstName__c"
    },
    {
        "type": "attribute",
        "label": "Person Name",
        "path": "ssot__PersonName__c"
    },
    { "type": "separator" },
    {
        "type": "affinity",
        "path": "RT_Interactions_By_Product__cio",
        "sectionLabel": "Product Affinities",
        "dimensionField": "productid__c",
        "affinityField": "interactioncount__c",
        "maxRows": 10
    },
    { "type": "separator" },
    {
        "type": "affinity",
        "path": "RT_Interactions_By_Category__cio",
        "sectionLabel": "Category Affinities",
        "dimensionField": "categoryid__c",
        "affinityField": "interactionscount__c",
        "maxRows": 20
    },
    { "type": "separator" },
    {
        "type": "segments",
        "path": "Individual_Unified_SM_1714394613851__dlm",
        "sectionLabel": "Segment Memberships",
    },
    {
        "type": "table",
        "path": "Individual_Unified_SM_1714394613851__dlm",
        "sectionLabel": "Segment Memberships as a Table",
        "columns": [
            {
                "label": "Segment",
                "property": "Segment_Id__c"
            },
            {
                "label": "Engagement Score",
                "property": "Delta_Type__c"
            }
        ]
    },
    {
        "type": "array",
        "path": "IndividualIdentityLink__dlm.ssot__Individual__dlm.ssot__ContactPointEmail__dlm",
        "attributes": [
            {
                "label": "Email",
                "path": "ssot__EmailAddress__c"
            }
        ]
    },
    {
        "type": "array",
        "path": "RT_Interactions_By_Product__cio",
        "attributes": [
            {
                "label": "Interaction Count",
                "path": "interactioncount__c"
            },
            {
                "label": "Interaction Name",
                "path": "interactionname__c"
            },
            {
                "label": "Product ID",
                "path": "productid__c"
            }
        ]
    }
];

function getNodesByPath(obj, path) {
    const pathParts = path.split('.');
    let currentNodes = [obj];

    for (const part of pathParts) {
        const nextNodes = [];

        for (const node of currentNodes) {
            if (node[part]) {
                if (Array.isArray(node[part])) {
                    nextNodes.push(...node[part]);
                } else {
                    nextNodes.push(node[part]);
                }
            }
        }
        currentNodes = nextNodes;
    }
    return currentNodes;
}

export async function renderConfig(profile, config = testConfig) {
    if (!config || config.length === 0) config = testConfig;//return ""

    let html = "";

    for(const item of config) {

        if (item.type === 'separator') {
            html += `<hr class="slds-m-vertical_large"/>`;
            continue;
        }

        const rows = getNodesByPath(profile, item.path);

        if (item.type === 'affinity') {
            html += `
            <h3 class="slds-text-heading_small slds-m-bottom_medium">
                <strong>${item.sectionLabel || 'Affinities'}</strong>
            </h3>
            ${renderAffinities(rows, item.dimensionField, item.affinityField, item.maxRows || 100)}
            `;
            continue;
        }

        if (item.type === 'table') {
            html += renderTable(rows, item.columns, item.sectionLabel);
            continue;
        }

        if(item.type === 'segments') {
            html += await renderSegments(rows, item.sectionLabel);
            continue;
        }

        if (item.type === 'attribute') {
            html += renderAttributes(rows, item.label);
            continue;
        }

        html += `<p>Unsupported config type: ${item.type}</p>`;
    }

    return html;
}

async function renderSegments(rows, sectionLabel) {
    if (rows.length === 0) return "";

    for (const element of rows) {
        element.Segment_Name__c = await getSegmentName({ segmentId: element.Segment_Id__c });
    }

    rows.sort((a, b) => {
        if (a.Delta_Type__c < b.Delta_Type__c) return -1;
        if (a.Delta_Type__c > b.Delta_Type__c) return 1;
        return 0;
    });

    return renderTable(rows, [
        {
            label: 'Segment Name',
            property: 'Segment_Name__c'
        },
        {
            label: 'Status',
            property: 'Delta_Type__c'
        }
    ], sectionLabel);

}

function renderTable(rows, columns, sectionLabel) {
    if (rows.length === 0) return "";

    const header = columns.map(col => `<th scope="col">${col.label}</th>`).join('');
    const body = rows.map(row => {
        const cells = columns.map(col => `<td>${row[col.property] || '-'}</td>`).join('');
        return `<tr>${cells}</tr>`;
    }).join('');

    return `
    <h3 class="slds-text-heading_small slds-m-bottom_medium">
        <strong>${sectionLabel || 'Table'}</strong>
    </h3>
    <table class="slds-table slds-table_cell-buffer slds-table_bordered slds-m-bottom_medium">
        <thead>
            <tr>${header}</tr>
        </thead>
        <tbody>
            ${body}
        </tbody>
    </table>`;
}

function renderAttributes(rows, label) {
    if (rows.length === 0) return "";

    const value = rows[0]; // Just take the first value for simplicity
    return `
    <div class="slds-grid slds-grid_align-spread slds-p-bottom_x-small">
        <span>${label}</span>
        <span aria-hidden="true">
            <strong>${value}</strong>
        </span>
    </div>`;
}

function renderAffinities(rows, dimensionField, affinityField, maxRows = 10) {
    // find max affinity value for scaling
    let maxAffinity = 0;
    for (const row of rows) {
        const affinityValue = row[affinityField];
        if (affinityValue > maxAffinity) {
            maxAffinity = affinityValue;
        }
    }

    maxAffinity = maxAffinity * 1.10; // add 10% padding to max value for better visualization

    // sort rows by affinity value
    rows.sort((a, b) => {
        return b[affinityField] - a[affinityField];
    });

    if (rows.length > maxRows) {
        rows = rows.slice(0, maxRows);
    }

    // render each row with a progress bar
    return rows.map(row => {
        const dimensionValue = row[dimensionField];
        const affinityValue = row[affinityField];
        const normalizedAffinity = maxAffinity > 0 ? affinityValue / maxAffinity : 0;

        if (!dimensionValue) return "";

        return renderProgressBar(dimensionValue, affinityValue, normalizedAffinity);
    }).join(' ');
}

// Add rendering methods here
export function renderProgressBar(label, affinityValue, normalizedValue) {
    const percentage = Math.round(normalizedValue * 100);

    return `
    <div class="slds-m-bottom_small">
        <div class="slds-grid slds-grid_align-spread slds-p-bottom_x-small" id="progress-bar-label-id-6">
            <span>${label || '-'}</span>
            <span aria-hidden="true">
            <strong>${affinityValue}</strong>
            </span>
        </div>
        <div class="slds-progress-bar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percentage}" aria-labelledby="progress-bar-label-id-6" role="progressbar">
            <span class="slds-progress-bar__value" style="width:${percentage}%">
            <span class="slds-assistive-text" id="progress-bar-label-id-6">${affinityValue}</span>
            </span>
        </div>
    </div>`
}
