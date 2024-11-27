import {userRouteV1} from './v1/user';
import {marketRouteV1} from './v1/market';
import express from 'express';

export const routes = express.Router();
routes.use('/v1/', userRouteV1);
routes.use('/v1/market/', marketRouteV1);