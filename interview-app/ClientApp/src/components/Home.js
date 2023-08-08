import React, { Component } from 'react';
import {FolderList} from './DocDisplay/FolderList.js'

export class Home extends Component {
  static displayName = Home.name;

  render() {
    return (
      <div>
        <FolderList />
      </div>
    );
  };
}
