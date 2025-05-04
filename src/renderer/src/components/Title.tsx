
import React from 'react';

type TitleProps = {
    content: string;
};

const Title: React.FC<TitleProps> = ({ content }) => {
    return (
        <div className="flex items-center justify-center h-1/12 text-xl font-bold text-gray-800 bg-gray-200">
            {content}
        </div>
    )
};

export default Title;