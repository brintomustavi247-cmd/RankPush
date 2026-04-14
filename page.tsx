import React from 'react';

const RankPushDashboard = () => {
    return (
        <div className="flex min-h-screen bg-background overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen overflow-y-auto">
                <Header />
                <MainArena />
            </div>
            {RightPanel && <RightPanel />}
        </div>
    );
};

export default RankPushDashboard;