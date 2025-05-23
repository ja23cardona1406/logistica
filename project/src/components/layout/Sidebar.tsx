import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PackageCheck,
  Clipboard,
  Users,
  Settings,
  Image,
  MessageSquareText,
  AlertTriangle
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center px-4 py-3 ${
      isActive
        ? 'bg-blue-800 text-white'
        : 'text-blue-100 hover:bg-blue-700'
    } transition-colors duration-200`;

  return (
    <aside className="flex flex-col w-64 bg-blue-900 h-screen">
      <div className="flex items-center justify-center h-16 bg-blue-950">
        <h1 className="text-xl font-bold text-white">
          REPREMUNDO
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          <li>
            <NavLink to="/dashboard" className={navLinkClass}>
              <LayoutDashboard size={20} className="mr-3" />
              <span>Dashboard</span>
            </NavLink>
          </li>

          <li>
            <NavLink to="/scanner" className={navLinkClass}>
              <PackageCheck size={20} className="mr-3" />
              <span>Escanear despacho</span>
            </NavLink>
          </li>

          <li>
            <NavLink to="/processes" className={navLinkClass}>
              <Clipboard size={20} className="mr-3" />
              <span>Procesos activos</span>
            </NavLink>
          </li>

          <li>
            <NavLink to="/best-practices" className={navLinkClass}>
              <Image size={20} className="mr-3" />
              <span>Procesos bien hechos</span>
            </NavLink>
          </li>

          <li>
            <NavLink to="/assistant" className={navLinkClass}>
              <MessageSquareText size={20} className="mr-3" />
              <span>Asistente virtual</span>
            </NavLink>
          </li>

          <div className="px-4 py-2 text-xs uppercase text-blue-300 font-semibold">
            Administración
          </div>

          <li>
            <NavLink to="/admin/alerts" className={navLinkClass}>
              <AlertTriangle size={20} className="mr-3" />
              <span>Alertas</span>
            </NavLink>
          </li>

          <li>
            <NavLink to="/admin/users" className={navLinkClass}>
              <Users size={20} className="mr-3" />
              <span>Usuarios</span>
            </NavLink>
          </li>

          <li>
            <NavLink to="/admin/process-management" className={navLinkClass}>
              <Settings size={20} className="mr-3" />
              <span>Gestión de procesos</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
