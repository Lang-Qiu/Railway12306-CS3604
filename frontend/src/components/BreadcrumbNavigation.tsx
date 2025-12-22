import React from 'react';
import { Link } from 'react-router-dom';
import './BreadcrumbNavigation.css';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
}

const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({ items }) => {
  return (
    <div className="breadcrumb-nav">
      <span className="breadcrumb-label">当前位置：</span>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="breadcrumb-separator">&gt;</span>}
          {item.path ? (
            <Link to={item.path} className="breadcrumb-item">
              {item.label}
            </Link>
          ) : (
            <span className={index === items.length - 1 ? 'breadcrumb-current' : 'breadcrumb-item'}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default BreadcrumbNavigation;
