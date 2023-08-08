import React, { Component } from 'react';
import ClosedFolderIcon from '../../assets/docIcons/closedFolder.svg'
import OpenFolderIcon from '../../assets/docIcons/openFolder.svg'
import { Doc } from './Doc'
import styled from 'styled-components'

// Folder Icon
const Icon = styled.img`
  height: 200px;
  width: 200px;
`

// Folder header
const FolderHeader = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  &:hover {
    background-color: #DDDDDD;
    cursor: pointer;
  }
  padding: 10px
`
// Folder label
const FolderLabel = styled.h1`
  font-size: 2.5rem;
  padding-left: 50px;
  user-select: none; /* Standard syntax */
`

// Container of list of docs
const DocContainer = styled.div`
display: grid;
grid-template-columns: repeat(auto-fill, 100px);
grid-gap: 1rem 5rem;
justify-content: space-between;
padding: 25px 5%
`

export class Folder extends Component {
  static displayName = Folder.name;

  constructor(props) {
    super(props);
    this.inputRef = React.createRef();
    this.state = { selectedFile: null};
    this.handleSelectedFileChange = this.handleSelectedFileChange.bind(this)
  }

  
  // Handles new file selection
  handleSelectedFileChange(event) {
    if(event.target.files) {
      this.setState({selectedFile: event.target.files[0]})
    }
  }

  // Returns file upload form
  getUpload(selectedFile, path, uploadDoc, onChange) {
    return <form
      onSubmit={event => {
        uploadDoc(
          selectedFile,
          path,
          selectedFile.name)
        this.setState({selectedFile: null})
        this.inputRef.current.value = ""
        event.preventDefault()
        }}
    >
      <h2>Upload new file</h2>
      
      <input ref={this.inputRef} id="file" type="file" onChange={onChange} />
      {/* Display upload button only if file is selected */}
      {selectedFile
        ? <button
        type="submit"
        >
          Upload File
        </button>
        : null
      }
    </form>
  }

  // Returns folder header element
  folderHeader(name, index, isOpen, openFolder) {
    // Choose open or closed folder icon
    let icon = isOpen ? OpenFolderIcon : ClosedFolderIcon
    let altText = isOpen ? "Open Folder" : "Closed Folder"
    return <FolderHeader onClick={() => {
      if (isOpen) {
        this.inputRef.current.value = ""
        this.setState({selectedFile: null})
      }
      openFolder(index)
    }}>
      <Icon src={icon} alt={altText}/>
      <FolderLabel>{name}</FolderLabel>
    </FolderHeader>
  }

  // Returns folder elemenet
  getFolder(isOpen, selectedFile, path, index, openFolder, openFile, uploadDoc, deleteDoc) {
    return <>
      {this.folderHeader(this.props.name, index, isOpen, openFolder)}
      {/* Display docs if folder is open */}
      {isOpen
        ? <>
          {this.getUpload(selectedFile, path, uploadDoc, this.handleSelectedFileChange)}
          <DocContainer>
            {this.props.docs.map((doc, i) =>
            <Doc
              key={i}
              doc={doc}
              openFile={openFile}
              deleteDoc={deleteDoc}
            />)}
          </DocContainer>
        </>
        : null
      }
    </>
  }

  render() {
    return (
      <div id={`folder ${this.props.index}`}>
        {this.getFolder(
          this.props.isOpen,
          this.state.selectedFile,
          this.props.path,
          this.props.index,
          this.props.openFolder,
          this.props.openFile,
          this.props.uploadDoc,
          this.props.deleteDoc
          )}
      </div>
    );
  }
}
