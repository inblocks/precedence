[DRAFT]

# _inBlocks precedence_



## What's this software for?

**_precedence_ brings secure blockchain-powered traceability features to your already existing legacy information system!**

**_precedence_** is the first open source ledger allowing non blockchain specialist to put in place a transparent, immutable, and cryptographically verifiable transaction log with a minimum effort and fully integrated to their existing database or file system.

**_precedence_** is compliant with multiple data sources:
- file system
- SQL databases
- noSQL databases
- stream processing

By connecting your data source to **_precedence_** you automatically get:
- proof-of-existence on every data connected
- proof-of-ownership compliant with your PKI
- automatic versioning system for every pieces of information

All these features allow you bring secure blockchain-powered traceability features to your legacy information system.

**_precedence_** is agnostic to the data type considered and can be use to bring immutable and undeniable traceability to every data that you already operate in your information system. Your system is most likely already compliant and there is no need to apply modification to it to start using **_precedence_**.

**_precedence_** is edited by [**_inBlocks_**](https://precedence.inblocks.io) so you can rely on us for hosting the solution for you, supporting you during the deployment and providing you a very strong SLA.



## Debezium example

[demo](https://github.com/inblocks/precedence-debezium/tree/poc-1/demo)



## Quick Start

### Prerequisites

- a [Redis](https://redis.io) version 5+ instance. If you don't have one, you can launch a container that will host a redis instance (not part of a cluster, not replicated, not scalable so not production-compliant). To do so you can run one of the following ways:

    - without persistence
    ```bash
    docker run --rm --name redis -p 6379:6379 \
        redis:alpine redis-server --appendonly no --save ""
    ```

    - with persistence, detached in background
    ```bash
    docker run -d --name redis -p 6379:6379 \
        -v $HOME/precedence-redis:/data \
        redis:alpine redis-server --appendonly yes --appendfsync always
    # remove container
    docker rm -f redis
    # remove data
    rm -rf $HOME/precedence-redis
    ```

- If you don't use [Docker](https://docs.docker.com): [Node.js](https://nodejs.org) version 8+ and [npm](https://www.npmjs.com) version 5+.



### Run the REST API

- From npm (coming soon)

- From [Docker](https://hub.docker.com/r/inblocks/precedence)
  ```bash
  # usage
  docker run --rm inblocks/precedence --help
  # run
  docker run --rm --name precedence --link redis -p 9000:9000 inblocks/precedence --redis redis:6379
  ```

- From [GitHub sources](https://github.com/inblocks/precedence)
  ```bash
  git clone https://github.com/inblocks/precedence.git
  cd precedence
  for module in api cli common core; do
      echo "$module"
      (cd "$module" && npm i)
  done
  for module in api cli; do
    (cd "$module" && npm link)
  done
  # usage
  precedence-api --help
  # run
  precedence-api
  ```



## Use it!

```bash
api="http://localhost:9000"

# data is not stored, explain each fields
curl -XPOST -H"content-type: application/octet-stream" "$api/records?pretty=true" -d "value 1"
# data = base 64
curl -XPOST -H"content-type: application/octet-stream" "$api/records?pretty=true&store=true" -d "value 2"
# same data but different hashes
curl -XPOST -H"content-type: application/octet-stream" "$api/records?pretty=true&store=true" -d "value 2"
# check hash (SHA-256 hexadecimal string)
curl -XPOST -H"content-type: application/octet-stream" "$api/records?pretty=true&store=true&hash=085a57ddb929d1a2853aad31940d6e718918762b8db43f299e86fe732d13d6b9" -d "value 4"
# specify your id -> idempotent, SHA-256 for GDPR (WARNING it's just a hash)
curl -XPOST -H"content-type: application/octet-stream" "$api/records?pretty=true&store=true&id=E518B4BB-2668-4ED7-B9E3-E63803BCAC93" -d "value 5"
# block = null
curl -XGET "$api/records/3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4?pretty=true"
# make the first block, explain each fields
curl -XPOST "$api/blocks?pretty=true"
# block = index + proof
curl -XGET "$api/records/3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4?pretty=true"
# delete
curl -XDELETE "$api/records/3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4?pretty=true"
# record still here, deleted = true, data/chains/seed deleted -> GDPR compliant, unable to prove data and chains 
curl -XGET "$api/records/3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4?pretty=true"

# previous = [ "3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4" ]
curl -XPOST -H"content-type: application/octet-stream" "$api/records?pretty=true&id=61E51581-7763-4486-BF04-35045DC7A0D3&previous=3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4" -d "value 6"
# next = [ "75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6" ]
curl -XGET "$api/records/3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4?pretty=true"
# 2 visited, 1 deleted because 3a31d56747785fafe73bc6745a1d21c6b8c38d14b7573fa3fe30745aded1e2c4 was already deleted
curl -XDELETE "$api/records/75bdb5a188a281c9576331b5573d5be50f7802d92cc591d9dbbbfbcb7ee42de6?pretty=true&previous=true"

# chain -> provable chain hash (GDPR), previous null because first
curl -XPOST -H"content-type: application/octet-stream" "$api/records?pretty=true&id=4FF6B617-F1CF-4F10-A314-4C7733A9DB7F&chain=chain1" -d "value 7"
# implicitly previous = [ "893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951" ]
curl -XPOST -H"content-type: application/octet-stream" "$api/records?pretty=true&id=2B6C83EF-474D-4A15-B1D5-A1EC7E8226CF&chain=chain1" -d "value 8"
# last
curl -XGET "$api/chains/chain1?pretty=true"
# multiple chains and or previous, 2 chains 2 previous -> 2 previous and not 4 because chain2 null (first), chain1 -> 893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951
curl -XPOST -H"content-type: application/octet-stream" "$api/records?pretty=true&chain=chain1&chain=chain2&previous=893f0b2b05ed0013789be0dfa521575f243d083c5a2654c60f948eef1ce9b951&previous=44d2fd22cebf91d4375260ae12565afa83cf18f24873f956728166c603091dd3" -d "value 9"
# chain1 = chain2
curl -XGET "$api/chains/chain1?pretty=true"
curl -XGET "$api/chains/chain2?pretty=true"
# = delete with "recursive=true" on the last of the chain + chain1 no longer exists
curl -XDELETE "$api/chains/chain1?pretty=true"
# chain2 still here
curl -XGET "$api/chains/chain2?pretty=true"

# max = count, explain each fields
curl -XPOST "$api/blocks?pretty=true&max=1"
# all remaining -> 3 records, others was deleted before the block, previous = root of previous
curl -XPOST "$api/blocks?pretty=true"
# count = 0
curl -XPOST "$api/blocks?pretty=true"
# no empty
curl -XPOST "$api/blocks?pretty=true&no-empty=true"
# last
curl -XGET "$api/blocks?pretty=true"
# by index
curl -XGET "$api/blocks/1?pretty=true"
# by root hash
root=$(curl -sS -XGET "$api/blocks/1?" | sed -En 's/.*"root":"([^"]*).*/\1/p')
curl -XGET "$api/blocks/$root?pretty=true"
```



## Tips

```bash
# create a block with a file
cat FILE | curl -v -XPOST -H"application/octet-stream" "http://localhost:8080/records" --data-binary @-

# redis interactive client
docker run --rm -it --network host redis redis-cli

# redis client command
docker run --rm -i --network host redis redis-cli info
docker run --rm -i --network host redis redis-cli eval "return #redis.call('keys', 'default.chain.dbserver1.*')" 0
```



## Ongoing developments

- ECMAScript 6 with unit/integration tests, code coverage, code documentation, loggers with log level
- listing of **_precedence_** errors
- split modules into dedicated projects?
- NPM publication
- a dedicated project precedence-proof
- features
    - Redis auto-reconnection (bad gateway error)
    - list nodes and chains with pagination
    - core/redis metrics
