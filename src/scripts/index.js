import '../styles/index.scss';

if (process.env.NODE_ENV === 'development') {
  require('../index.html');
}

import App from './App';

new App();
