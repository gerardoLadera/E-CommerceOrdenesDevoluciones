import { Injectable, OnModuleInit } from '@nestjs/common';
import { MongoClient } from 'mongodb';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MongoService implements OnModuleInit {
    private client: MongoClient;
    public db: any;

    constructor(private readonly configService: ConfigService) {}

    async onModuleInit() {
        const uri = this.configService.get<string>('MONGO_URI');
        if (!uri) {
            throw new Error(' MONGO_URI no está definida en el entorno');
        }

        this.client = new MongoClient(uri);
        try {
        await this.client.connect();
        this.db = this.client.db(); 
        console.log('Conectado a MongoDB desde MongoService');
        } catch (err) {
        console.error('Error al conectar a MongoDB:', err);
        setTimeout(() => this.onModuleInit(), 5000); 
        }
    }

    getCollection(name: string) {
        return this.db.collection(name);
    }
}