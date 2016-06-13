'use babel';

import AtomAcidView from './atom-acid-view';
import AcidProvider from './provider';
import { CompositeDisposable } from 'atom';

export default {

  activate(state) {

  },

  deactivate() {

  },

  serialize() {

  },

  toggle() {

  },

  getProvider () {
      return new AcidProvider();
  }

};
