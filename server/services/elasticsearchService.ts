import { Client } from '@elastic/elasticsearch';

const client = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
});

const INDEX_NAME = 'emails';

export async function initializeElasticsearch() {
  try {
    const indexExists = await client.indices.exists({ index: INDEX_NAME });

    if (!indexExists) {
      await client.indices.create({
        index: INDEX_NAME,
        body: {
          mappings: {
            properties: {
              account_id: { type: 'keyword' },
              message_id: { type: 'keyword' },
              uid: { type: 'keyword' },
              subject: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              from_address: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              from_name: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' }
                }
              },
              folder: { type: 'keyword' },
              body_text: { type: 'text' },
              body_html: { type: 'text' },
              category: { type: 'keyword' },
              received_at: { type: 'date' },
              is_read: { type: 'boolean' },
              indexed_at: { type: 'date' },
            },
          },
        },
      });

      console.log(`Created Elasticsearch index: ${INDEX_NAME}`);
    } else {
      console.log(`Elasticsearch index already exists: ${INDEX_NAME}`);
    }
  } catch (error) {
    console.error('Error initializing Elasticsearch:', error);
    throw error;
  }
}

export async function indexEmail(emailId: string, emailData: any) {
  try {
    await client.index({
      index: INDEX_NAME,
      id: emailId,
      body: {
        ...emailData,
        indexed_at: new Date(),
      },
    });

    console.log(`Indexed email ${emailId} in Elasticsearch`);
  } catch (error) {
    console.error('Error indexing email:', error);
  }
}

export async function searchEmails(query: string, filters: {
  accountId?: string;
  folder?: string;
  category?: string;
  from?: number;
  size?: number;
}) {
  try {
    const must: any[] = [];

    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['subject^2', 'body_text', 'from_address', 'from_name'],
          type: 'best_fields',
          fuzziness: 'AUTO',
        },
      });
    }

    if (filters.accountId) {
      must.push({ term: { account_id: filters.accountId } });
    }

    if (filters.folder) {
      must.push({ term: { folder: filters.folder } });
    }

    if (filters.category) {
      must.push({ term: { category: filters.category } });
    }

    const result = await client.search({
      index: INDEX_NAME,
      body: {
        from: filters.from || 0,
        size: filters.size || 50,
        query: {
          bool: {
            must: must.length > 0 ? must : [{ match_all: {} }],
          },
        },
        sort: [{ received_at: { order: 'desc' } }],
      },
    });

    return {
      total: typeof result.hits.total === 'object' ? result.hits.total.value : result.hits.total,
      hits: result.hits.hits.map((hit: any) => ({
        id: hit._id,
        score: hit._score,
        ...hit._source,
      })),
    };
  } catch (error) {
    console.error('Error searching emails:', error);
    throw error;
  }
}

export async function deleteEmailFromIndex(emailId: string) {
  try {
    await client.delete({
      index: INDEX_NAME,
      id: emailId,
    });

    console.log(`Deleted email ${emailId} from Elasticsearch`);
  } catch (error) {
    console.error('Error deleting email from index:', error);
  }
}

export async function checkElasticsearchHealth() {
  try {
    const health = await client.cluster.health();
    console.log('Elasticsearch health:', health);
    return health;
  } catch (error) {
    console.error('Elasticsearch health check failed:', error);
    throw error;
  }
}
