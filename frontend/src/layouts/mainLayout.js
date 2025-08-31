
// import Sidebar from './sideBar';
import React from 'react';
import Header from '../components/Header';
import { Container } from 'react-bootstrap';
import Footer from '../components/Footer';
import { Outlet } from 'react-router-dom';
function MainLayout() {
    return (
        <div className="d-flex flex-column min-vh-100">
            <Header />
            <Container fluid className="flex-grow-1 p-0">
                <div className="d-flex">
                    {/* <div className="sidebar-wrapper">
                        <Sidebar />
                    </div> */}
                    <div className="main-content flex-grow-1 p-4">
                        <Outlet />
                    </div>
                </div>
            </Container>
            <Footer />
        </div>
    );
}

export default MainLayout;
