import { Injectable } from '@nestjs/common';

import UserDto from './user.dto'

import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

let url = process.env.REDIS_URL || 'redis-11687.c261.us-east-1-4.ec2.cloud.redislabs.com:11687'
let username = process.env.REDIS_USERNAME || 'default'
let password = process.env.REDIS_PASSWORD || 'nothing'

let connection = `redis://${username}:${password}@${url}`

@Injectable()
export class AppService {
  private redis: any

  constructor() {
    // init database
    this.redis = new Redis(connection);
  }

  // i need a find all users method in nestjs using ioredis
  // add paging, filtering, and sorting to that method
  async findAllUsers(
    page: number,
    pageSize: number,
    filters: any[],
    sortBy: string,
    sortDirection: 'asc' | 'desc',
  ): Promise<any> {
    let that = this 

    let userIds = await this.redis.keys('user:*');
    
    // Apply filters, if any
    if (filters && filters.length) {
      userIds = await Promise.all(
        userIds.map(async (id) => {
          let record = JSON.parse(await that.redis.get(id));
          for (let filter of filters) {
            for (const key in filter) {
              if (record[key] === filter[key]) {
                return id;
              }
            }
          }
          return null;
        })
      );
      userIds = userIds.filter(id => id !== null);
    }
    // console.log('userIds', userIds)

    if (userIds.length) {
      // Apply sorting, if any
      if (sortBy) {
        userIds = userIds.sort(async (a, b) => {
          let aRecord = JSON.parse(await that.redis.get(a))
          let bRecord = JSON.parse(await that.redis.get(b))
          const aValue = aRecord[sortBy];
          const bValue = bRecord[sortBy];
          if (aValue === bValue) {
            return 0;
          }
          if (sortDirection === 'asc') {
            return aValue < bValue ? -1 : 1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
      }
    
      // Apply paging
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize - 1;
      userIds = userIds.slice(startIndex, endIndex + 1);
      // console.log('final userIds', userIds)

      // Retrieve the actual user objects
      let results = await this.redis.mget(userIds);
      let users = []
      results.forEach((value) => {
        users.push(JSON.parse(value))
      })
      return users
    } else {
      return []
    }
  }

  async createUser(record: UserDto): Promise<any> {
    let id = record.id
    let value = JSON.stringify(record)

    await this.redis.set(`user:${id}`, value);

    return record
  }

  async updateUserById(id: string, record: UserDto): Promise<any> {
    let result = await this.redis.get(`user:${id}`)
    let original = JSON.parse(result)
    let change = record
    let merged = { ...original, ...change }
    let save = JSON.stringify(merged)

    await this.redis.set(`user:${id}`, save);

    return merged
  }

  async getUserById(id: string): Promise<any> {
    let result = await this.redis.get(`user:${id}`)
    return JSON.parse(result)
  }

  initiate (fromUser: any, toUser: any, socketService): any {
    // web socket secure
    let wss = socketService.wss()

    // only expose peer id and user id
    let from = {
      userId: fromUser.id,
      peerId: fromUser.peerId
    }
    let to = {
      userId: toUser.id,
      peerId: toUser.peerId
    }
    let message = { 
      id: uuidv4(),
      from, 
      to
    }
    
    // mailbox
    let event = 'signal';
    let channel1 = fromUser.firebaseId
    let channel2 = toUser.firebaseId
    
    // notify both parties
    wss.trigger(channel1, event, message);
    wss.trigger(channel2, event, message);

    return 'success'
  }

  async deleteUserById(id: string): Promise<any> {
    let key = `user:${id}`
    if (await this.redis.exists(key)) {
      await this.redis.del(key);
      return true;
    } else {
      return false;
    }
  }

  getHello(): string {
    return 'Hello World!';
  }
}
