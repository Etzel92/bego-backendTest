import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';
import { Location, LocationSchema } from './schemas/location.schema';

@Module({
  imports: [
    ConfigModule,
    HttpModule.register({ timeout: 8000, maxRedirects: 2 }),
    MongooseModule.forFeature([{ name: Location.name, schema: LocationSchema }]),
  ],
  controllers: [LocationsController],
  providers: [LocationsService],
  exports: [LocationsService],
})
export class LocationsModule {}
