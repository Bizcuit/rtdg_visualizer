/**
 * Utility functions for rendering different types of content in the RTDG Visualizer component
 */
import getSegmentName from '@salesforce/apex/DataCloudSegmentHelper.getSegmentName';

export function getTestConfig(){
    return testConfig;
} 

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
    {
        "type": "separator"
    },
    {
        "type": "affinity",
        "path": "RT_Interactions_By_Product__cio",
        "sectionLabel": "Product Affinities",
        "dimensionField": "productid__c",
        "affinityField": "interactioncount__c",
        "maxRows": 10
    },
    {
        "type": "separator"
    },
    {
        "type": "affinity",
        "path": "RT_Interactions_By_Category__cio",
        "sectionLabel": "Category Affinities",
        "dimensionField": "categoryid__c",
        "affinityField": "interactionscount__c",
        "maxRows": 20
    },
    {
        "type": "separator"
    },
    {
        "type": "segments",
        "path": "Individual_Unified_SM_1714394613851__dlm",
        "sectionLabel": "Segment Memberships"
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
        "type": "engagement",
        "maxRows": 20,
        "items": [
            {
                "label": "Product Browse",
                "path": "IndividualIdentityLink__dlm.ssot__Individual__dlm.ssot__ProductBrowseEngagement__dlm",
                "color": "green",
                "fields": {
                    "timestamp": "ssot__EngagementDateTm__c",
                    "title": "ssot__EngagementChannelActionId__c",
                    "detail": "ssot__ProductId__c"
                }
            },
            {
                "label": "Category Browse",
                "path": "IndividualIdentityLink__dlm.ssot__Individual__dlm.CategoryBrowseEngagement__dlm",
                "color:": "blue",
                "fields": {
                    "timestamp": "CreatedDate__c",
                    "title": "CategoryId__c",
                    "detail": "EngagementType__c"
                }
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


export async function renderConfig(profile, config) {
    console.log('Rendering config with profile:', profile, config);

    if (!config?.length || !profile) return "";

    let html = "";

    for (const item of config) {

        if (item.type === 'separator') {
            html += `<hr class="slds-m-vertical_medium"/>`;
            continue;
        }

        if (item.type === 'engagement') {
            html += renderEngagement(profile, item);
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

        if (item.type === 'segments') {
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

/**
 * Formats a timestamp as relative time or date based on user's timezone
 * @param {String} timestamp - ISO timestamp string
 * @returns {Object} Object with date and time properties for display
 */
function formatTimestamp(timestamp) {
    if (!timestamp) return { date: '-', time: '' };

    const date = new Date(timestamp);
    const now = new Date();

    // Get start of today in user's timezone
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if the timestamp is from today
    if (date >= todayStart) {
        // Calculate difference in milliseconds
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const remainingMinutes = diffMinutes % 60;

        if (diffHours === 0) {
            return {
                date: `${diffMinutes} min${diffMinutes !== 1 ? 's' : ''}`,
                time: 'ago'
            };
        } else if (remainingMinutes === 0) {
            return {
                date: `${diffHours} hour${diffHours !== 1 ? 's' : ''}`,
                time: 'ago'
            };
        } else {
            return {
                date: `${diffHours}h ${remainingMinutes}m`,
                time: 'ago'
            };
        }
    } else {
        // Format date and time separately in user's timezone
        const dateOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        const timeOptions = {
            hour: '2-digit',
            minute: '2-digit'
        };
        return {
            date: date.toLocaleDateString(undefined, dateOptions),
            time: date.toLocaleTimeString(undefined, timeOptions)
        };
    }
}

function renderEngagement(profile, engagementConfig) {
    let allRows = [];

    for (const item of engagementConfig.items) {
        const rows = getNodesByPath(profile, item.path);

        allRows.push(...rows.map(row => {
            const timestamp = row[item.fields.timestamp];
            const title = row[item.fields.title];
            const detail = row[item.fields.detail];
            const label = item.label;
            const color = item.color || 'gray';

            return { timestamp, title, detail, label, color };
        }));
    }

    // Sort all rows by timestamp
    allRows.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    allRows = allRows.slice(0, engagementConfig.maxRows || 20);

    // Render the engagements in a timeline format
    let html = `
        <h3 class="slds-text-heading_small slds-m-bottom_medium"><strong>Engagement Timeline</strong></h3>
        <div class="">
        <ul class="slds-bottom-space">`;

    for (const row of allRows) {
        const formattedTime = formatTimestamp(row.timestamp);
        html += `
            <li class="slds-item">
                <div class="slds-grid slds-p-bottom_medium" style="position: relative;">
                    <div style="width: 4px; background-color: ${row.color}; border-radius: 1.5px;" class="slds-m-right_medium"></div>
                    <span class="slds-badge slds-text-align_left slds-m-right_medium" style="min-width: 100px; padding: 0.25rem 0.5rem;">
                        <div style="line-height: 1.2;">
                            <div style="font-size: 0.75rem; font-weight: bold;">${formattedTime.date}</div>
                            <div style="font-size: 0.7rem;">${formattedTime.time}</div>
                        </div>
                    </span>
                    <span>
                        <p><strong>${row.label}:</strong> ${row.title}</p>
                        <p>${row.detail}</p>
                    </span>
                </div>
            </li>
        `
    }

    html += `</ul></div>`;

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
    return '<div class="slds-p-bottom_medium">' + rows.map(row => {
        const dimensionValue = row[dimensionField];
        const affinityValue = row[affinityField];
        const normalizedAffinity = maxAffinity > 0 ? affinityValue / maxAffinity : 0;

        if (!dimensionValue) return "";

        return renderProgressBar(dimensionValue, affinityValue, normalizedAffinity);
    }).join(' ') + '</div>';
}

function renderProgressBar(label, affinityValue, normalizedValue) {
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
