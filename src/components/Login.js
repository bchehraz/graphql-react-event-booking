import React from 'react';
import PropTypes from 'prop-types';
import { navigate } from 'gatsby';

import Form from './Form';
import View from './View';
import AuthContext from '../context/auth-context';
import delay from '../utils/delay';

const ERRORS = {
  loginFail: "Email or password is incorrect",
  signUpFail: "Email already signed up",
  emptyEmail: "Enter your email",
  emptyPassword: "Enter your password",
  emptyFields: "Invalid Login",
}

const SUCCESS_LABEL = {
  signUp: 'Done! Logging in...',
  login: 'Authenticated!'
}

class Login extends React.Component {
  static contextType = AuthContext;

  constructor(props) {
    super(props);

    this.state = {
      email: ``,
      password: ``,
      signUp: props.signUp,
      error: null,
      selectable: true,
      loading: false,
      success: false,
    }
  }

  handleUpdate(event) {
    this.setState({
      [event.target.name]: event.target.value,
    });
  }

  getLoginError = (email, password) => {
    if (!email) {
      if (!password) {
        return ERRORS.emptyFields;
      }
      return ERRORS.emptyEmail;
    } else if (!password) {
      return ERRORS.emptyPassword;
    }
    return null;
  }

  handleSubmit(event) {
    event.preventDefault();
    const { email, password, signUp } = this.state;

    // Error Checking
    const error = this.getLoginError(email, password);

    // update error
    this.setState({ error });
    if (error) {
      return false;
    }

    //Make text fields non-selectable while request is being sent
    // also start loading
    this.setState({ selectable: false, loading: true });

    let requestBody = {
      query: `
        query Login($email: String!, $password: String!) {
          login(
            email: $email,
            password: $password
          ) {
            userId
            token
            tokenExpiration
            email
          }
        }
      `
    };

    if (signUp) {
      requestBody = {
        query: `
          mutation SignUp($email: String!, $password: String!) {
            createUser(userInput: {
              email: $email,
              password: $password
            }) {
              userId
              email
              token
              tokenExpiration
            }
          }
        `
      };
    }
    requestBody.variables = { email, password };

    const action = (signUp) ? "Sign Up" : "Log In";
    fetch('https://graphql-event-booking.herokuapp.com/graphql', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(res => {
      if(res.status !== 200 && res.status !== 201) {
        this.setState({ error: (signUp) ? ERRORS.signUpFail : ERRORS.loginFail });
        this.setState({ selectable: true, loading: false });
        throw new Error("Server Output >> " + action + " Request Failed");
      }
      return res.json();
    }).then(resData => { // successful login or sign up
      if (resData.data.login) {
        const { token, userId, tokenExpiration, email } = resData.data.login;
        this.setState({ selectable: true, loading: false, success: true });
        delay(() => this.context.login(token, userId, tokenExpiration, email), 1000);
      } else if (resData.data.createUser) {
        const { token, userId, tokenExpiration, email } = resData.data.createUser;
        this.setState({ selectable: true, loading: false, success: true });
        delay(() => this.context.login(token, userId, tokenExpiration, email), 1000);
      }
    }).catch(err => {
      console.log(err);
    });

    return true;
  }

  switchForm(event) {
    event.preventDefault();
    const { signUp } = this.props;
    this.setState({
      ...this.state,
      signUp: !signUp,
    });
    if (!signUp) {
      navigate(`/app/sign-up`);
    } else {
      navigate(`/app/login`);
    }
  }

  getResponse = () => {
    const { error, success } = this.state;

    if (error) {
      return <p className="error">{error}</p>;
    } else if (success) {
      return <p className="success">{(this.state.signUp) ? SUCCESS_LABEL.signUp : SUCCESS_LABEL.login }</p>;
    }
    return null;
  }

  render() {
    const response = this.getResponse();
    const { email, password, selectable, loading, success } = this.state;
    return (
      <View title={(this.props.signUp) ? 'Create a New Account' : 'Log In'}>
        <Form
          handleUpdate={e => this.handleUpdate(e)}
          handleSubmit={e => this.handleSubmit(e)}
          signUp={this.props.signUp}
          switchForm={e => this.switchForm(e)}
          email={email}
          password={password}
          selectable={selectable}
          response={response}
          isLoading={loading}
          success={success}
        />
      </View>
    );
  }
}

Login.propTypes = {
  signUp: PropTypes.bool,
}

export default Login;
