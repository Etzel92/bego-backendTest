import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>('mongodbUri');
        if (!uri) throw new Error('MONGODB_URI not set');
        return {
          uri,
          // options recomendadas
          serverSelectionTimeoutMS: 5000,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
