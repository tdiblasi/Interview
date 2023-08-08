import React, { Component } from 'react';
import { Folder } from './Folder'

export class FolderList extends Component {
  static displayName = FolderList.name;

  constructor(props) {
    super(props);
    this.state = {
      docData: [],
      loading: true,
      openIndex: sessionStorage.getItem('openIndex')
        ? parseInt(sessionStorage.getItem('openIndex'))
        : -1,
      displayForm: false,
      selectedFile: null
    };
    // Bind functions
    this.openFolder = this.openFolder.bind(this)
    this.openFile = this.openFile.bind(this)
    this.selectFile = this.selectFile.bind(this)
    this.deleteDoc = this.deleteDoc.bind(this)
    this.uploadDoc = this.uploadDoc.bind(this)
    this.readerOnLoad = this.readerOnLoad.bind(this)
  }

  componentDidMount() {
    this.getDocData();
  }

  // Set selected file
  selectFile(file) {
    this.setState({selectedFile: file});
  }

  // Set opened folder
  openFolder(index) {
    // Close if already open, otherwise open
    if(index === this.state.openIndex) {
      sessionStorage.setItem('openIndex', -1)
      this.setState({openIndex: -1})
    } else {
      sessionStorage.setItem('openIndex', index)
      this.setState({openIndex: index})
    }
  }

  // Display all folders
  displayFolders(folders, openIndex) {
    return (
      <>
        {folders.map((folder, i) => (
          <Folder
            key={i}
            index={i}
            isOpen={i === openIndex}
            name={folder.Category}
            path={folder.Path}
            openFolder={this.openFolder}
            openFile={this.openFile}
            uploadDoc={this.uploadDoc}
            deleteDoc={this.deleteDoc}
            docs={folder.MyDocs}/>
        )
        )}
      </>
    )
  }

  render() {
    let contents = this.state.loading
      ? <p><em>Loading...</em></p>
      : this.displayFolders(this.state.docData, this.state.openIndex);

    return (
      <div>
        <h1 id="tableLabel">Docs</h1>
        {contents}
      </div>
    );
  }

  // Return folders and docs
  async getDocData() {
    const response = await fetch('docs');
    const data = await response.json();
    this.setState({ docData: JSON.parse(data), loading: false});
  }

  // Open a pdf in new window
  async openFile(path) {
    fetch("docs/downloadpdf", {
        method: "POST",
        body: JSON.stringify({Path: path}),
        headers: {
          'Content-Type': 'application/json'
        }
    })
    .then(response => response.blob())
    .then(data => window.open(URL.createObjectURL(data)))
  }

  // Delete doc
  async deleteDoc(file) {
    fetch("docs?name=" + encodeURIComponent(file), {
      method: "DELETE",
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    .then(res => {
      if (!res.ok) {
        res.text().then(text => {
          throw Error(text);
      }).catch((error) => {
          alert(error)
      });
      } else {
        return res.json()
      }
    })
    .then(res => this.getDocData());
  }

  // Upload pdf once read
  async readerOnLoad(event) {
    event.target.docData.FileData = event.target.result
    try {
      fetch("docs/uploadpdf", {
        method: "POST",
        body: JSON.stringify(event.target.docData),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(res => {
        if (!res.ok) {
          res.text().then(text => {
            throw Error(text);
        }).catch((error) => {
            alert(error)
        });
        } else {
          return res.json()
        }
      })
      .then(res => {
          this.getDocData()
        }
      )
    } catch (error) {
      alert(error);
    }
  }

  // Upload new doc
  async uploadDoc(file, path, name) {
    const reader = new FileReader()
    reader.docData = {
      Path: path,
      Name: name, 
    }
    reader.readAsDataURL(file)
    reader.onload = this.readerOnLoad
    reader.onerror = function (error) {
      alert("Error: " + error)
    }
  }
}

