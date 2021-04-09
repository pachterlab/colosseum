import _ from 'lodash';
import React from 'react';
import {
  Container,
  Navbar,
} from 'react-bootstrap';
import './bootstrap.min.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import queryString from 'query-string';

import { ColosseumUI } from './ColosseumUI';

const urlParams = queryString.parse(window.location.search);
const isDevelopment = _.has(urlParams, 'dev');
const isConnected = _.has(urlParams, 'connected');

class App extends React.Component {
  componentDidMount() {
    document.title = 'Colosseum UI';
  }

  render() {
    return (
      <>
        <Container className="mb-4">
          <Navbar bg="dark" variant="dark">
            <Navbar.Brand>Colosseum UI</Navbar.Brand>
            <Navbar.Collapse className="justify-content-end">
              <Navbar.Text className="mr-3">
                <FontAwesomeIcon icon={faGithub} className="mr-1"/>
                <a href="https://github.com/pachterlab/colosseum">pachterlab/colosseum</a>
              </Navbar.Text>
              <Navbar.Text>
                doi: <a href="https://doi.org/10.1101/2021.01.27.428538">10.1101/2021.01.27.428538</a>
              </Navbar.Text>
            </Navbar.Collapse>
          </Navbar>
        </Container>
        <Container className="w-75">
          <ColosseumUI development={isDevelopment} connected={isConnected}/>
        </Container>
      </>
    );
  }
}
export default App;
