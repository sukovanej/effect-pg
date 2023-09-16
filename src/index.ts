import * as Config from 'effect-pg/config';
import * as Errors from 'effect-pg/errors';
import * as Layers from 'effect-pg/layers';
import * as Query from 'effect-pg/query';
import * as Services from 'effect-pg/services';

const Pg = {
  ...Config,
  ...Errors,
  ...Layers,
  ...Query,
  ...Services,
};

export default Pg;
