import React from 'react';
import { Router, Redirect } from '@reach/router';

import Layout from '../components/Layout';
import Login from '../components/Login';
import PrivateRoute from '../components/PrivateRoute';

//import EventsPage from './components/events';
import Home from '../components/Home';
import Events from '../components/Events';
import Bookings from '../components/Bookings';
import Status from '../components/Status';
import AuthContext from '../context/auth-context';
import { isLoggedIn, onLoginSuccess } from '../utils/auth.js';

class App extends React.Component {
  state = {
    token: null,
    userId: null,
  }

  componentDidMount() {
    const { token, userId } = isLoggedIn();
    this.setState({ token, userId });
  }

  login = (token, userId, tokenExpiration) => {
    this.setState({ token, userId, tokenExpiration });
    onLoginSuccess(token, userId, tokenExpiration);
  }

  logout = () => {
    this.setState({ token: null, userId: null });
  }

  render() {
    return (
      <AuthContext.Provider
        value={{
          token: this.state.token,
          userId: this.state.userId,
          login: this.login,
          logout: this.logout,
        }}
      >
        <Layout>
          <Status />
          <Router>
            {this.state.token && <Redirect from="/app/login" to="/app/events" exact noThrow />}

            <PrivateRoute path="/app/bookings" component={Bookings} />
            <Events path="/app/events" />
            <Login signUp={false} path="/app/login" />
            <Login signUp path="/app/sign-up" />
            <Home path="/" exact />
          </Router>
        </Layout>
      </AuthContext.Provider>
    );
  }
}

export default App;
