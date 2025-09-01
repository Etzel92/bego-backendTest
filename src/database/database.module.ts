import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Soporta tanto tu config(`mongodbUri`) como .env(`MONGODB_URI`)
        const uri =
          config.get<string>('mongodbUri') || config.get<string>('MONGODB_URI');

        if (!uri) throw new Error('MONGODB_URI not set');

        const isProd = config.get<string>('NODE_ENV') === 'production';

        return {
          uri,
          serverSelectionTimeoutMS: 5000,
          maxPoolSize: 10,
          autoIndex: !isProd, // crea índices automáticamente en dev
        };
      },
    }),
  ],
})
export class DatabaseModule {}
