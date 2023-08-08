import React, { Component } from 'react';
import PdfIcon from '../../assets/docIcons/Icon_pdf_file.svg'
import styled from 'styled-components'

// PDF icon
const Icon = styled.img`
  height: 200px;
  width: 200px;
`

// Container for doc
const DocItem = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
`

// Click to open file
const FileSelect = styled.div`
  &:hover {
    background-color: #DDDDDD;
    cursor: pointer;
  }
`

// Label css
const Label = styled.h2`
  font-size: 1.5rem;
  text-align: center
`

// Sublabel css
const Sublabel = styled.h2`
font-size: 1rem;
text-align: center
`

const DeleteButton = styled.button`
  margin-top: 0.25rem;
  color: black;
  background-color: #f0f0f0;
  &:hover {
    background-color: #dddddd
  }
`

export class Doc extends Component {
  static displayName = Doc.name;

  // Handles delete button click
  handleDelete(doc, deleteDoc) {
    if(window.confirm("Are you sure you'd like to delete " + doc.Name)) {
      deleteDoc(doc.Path)
    }
  }

  render() {
    let path = this.props.doc.Path
    let fileName = path.substring(path.lastIndexOf("\\") + 1)
    return (
      <DocItem>
        <FileSelect>
          <Label>{this.props.doc.Name}</Label>
          <Icon src={PdfIcon} alt="PDF icon" onClick={() => this.props.openFile(path)}/>
          <Sublabel>{fileName}</Sublabel>
        </FileSelect>
        <DeleteButton onClick={() => this.handleDelete(this.props.doc, this.props.deleteDoc)}>Delete</DeleteButton>
      </DocItem>
    );
  }
}
