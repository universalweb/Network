const { construct } = self.$;
import { AppWorker } from './app';
self.app = construct(AppWorker, []);
