import React from 'react';

const MainBtn = ({ content, onClick, type = 'button' }) => (
    <button
        type={type}
        onClick={onClick}
        className='p-4 bg-[#111827] text-white rounded-lg cursor-pointer dark:bg-[#6366f1]'
    >
        {content}
    </button>
);

export default MainBtn;