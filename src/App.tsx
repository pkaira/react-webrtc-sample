import React, { useState} from 'react'
import logo from './logo.svg'
import {Container } from '@mui/material'
import Select, {SelectChangeEvent} from '@mui/material/Select'
import './App.css'
import { Header } from './Components/Header';
import { AppContextProvider } from './Components/AppContextProvider'
import { VideoLayout } from './Components/VideoLayout'
import { PeerInfo } from './Components/PeerInfo'
import { DataInterface } from './Components/DataInterface'
function App() {
  return (
    <div className="App">
      <Container>
        <AppContextProvider>
          <PeerInfo />
          <Header/>
          <DataInterface/>
          <VideoLayout/>
        </AppContextProvider>
      </Container>
    </div>
  );
}

export default App;
