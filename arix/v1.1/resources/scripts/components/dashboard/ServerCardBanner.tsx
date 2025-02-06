import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import tw from 'twin.macro';
import Spinner from '@/components/elements/Spinner';
import { useTranslation } from 'react-i18next';

// Determines if the current value is in an alarm threshold so we can show it in red rather
// than the more faded default style.
const isAlarmState = (current: number, limit: number): boolean => limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

type Timer = ReturnType<typeof setInterval>;

export default ({ server }: { server: Server }) => {
    const { t } = useTranslation(['arix/utilities', 'arix/dashboard']);
    const interval = useRef<Timer>(null) as React.MutableRefObject<Timer>;
    const [isSuspended, setIsSuspended] = useState(server.status === 'suspended');
    const [stats, setStats] = useState<ServerStats | null>(null);

    const getStats = () =>
        getServerResourceUsage(server.uuid)
            .then((data) => setStats(data))
            .catch((error) => console.error(error));

    useEffect(() => {
        setIsSuspended(stats?.isSuspended || server.status === 'suspended');
    }, [stats?.isSuspended, server.status]);

    useEffect(() => {
        // Don't waste a HTTP request if there is nothing important to show to the user because
        // the server is suspended.
        if (isSuspended) return;

        getStats().then(() => {
            interval.current = setInterval(() => getStats(), 30000);
        });

        return () => {
            interval.current && clearInterval(interval.current);
        };
    }, [isSuspended]);

    const alarms = { cpu: false, memory: false, disk: false };
    if (stats) {
        alarms.cpu = server.limits.cpu === 0 ? false : stats.cpuUsagePercent >= server.limits.cpu * 0.9;
        alarms.memory = isAlarmState(stats.memoryUsageInBytes, server.limits.memory);
        alarms.disk = server.limits.disk === 0 ? false : isAlarmState(stats.diskUsageInBytes, server.limits.disk);
    }

    const diskLimit = server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : t('unlimited');
    const memoryLimit = server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : t('unlimited');
    const cpuLimit = server.limits.cpu !== 0 ? server.limits.cpu + '%' : t('unlimited');

    return (
        <>
        <div className="bg-gray-700 backdrop overflow-hidden rounded-box">
            <div className="flex z-10 items-center justify-between bg-center bg-cover bg-no-repeat px-6 pt-5 pb-10 relative" css={`background-image:url(${server.eggImage ? server.eggImage : '/arix/minecraft-banner.png'})`}>
                <div className="z-[-1] absolute inset-0" css={'background-color:color-mix(in srgb, var(--gray700-default) 65%, transparent);'}/>
                <p className="text-lg font-semibold text-gray-50">{server.name}</p>
                <span className={`py-1 px-2 rounded
                    ${stats?.status === 'offline'
                        ? 'text-danger-50'
                        : stats?.status === 'running' 
                        ? 'text-success-50'
                        : stats?.status === 'starting' 
                        ? 'text-yellow-50 bg-yellow-500/40'
                        : stats?.status === 'stopping'
                        ? 'text-red-50 bg-red-500/40'
                        : ''
                    }
                `}
                css={`${stats?.status === 'offline'
                        ? 'background-color: color-mix(in srgb, var(--dangerBackground) 40%, transparent);'
                        : stats?.status === 'running'
                        ? 'background-color: color-mix(in srgb, var(--successBackground) 40%, transparent);'
                        : ''
                    }`}
                >
                    {stats?.status === 'offline'
                        ? t('offline')
                        : stats?.status === 'running'
                        ? t('online')
                        : stats?.status === 'starting'
                        ? t('starting')
                        : stats?.status === 'stopping'
                        ? t('stopping')
                        : ''
                    }
                </span>
            </div>
            <div className="grid lg:grid-cols-2 gap-2 my-4 px-6">
                <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-300 font-light">IP:</span>
                    {server.allocations
                        .filter((alloc) => alloc.isDefault)
                        .map((allocation) => (
                            <React.Fragment key={allocation.ip + allocation.port.toString()}>
                                {allocation.alias || ip(allocation.ip)}:{allocation.port}
                            </React.Fragment>
                        ))}
                </div>
                {!stats || isSuspended ? (
                    isSuspended ? (
                        <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-300 font-light">Status:</span>
                            <span css={tw`bg-danger-200 rounded px-2 py-1 text-danger-50`}>
                                {server.status === 'suspended' ? t('suspended') : t('connection-error')}
                            </span>
                        </div>
                    ) : server.isTransferring || server.status ? (
                        <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-300 font-light">Status:</span>
                            <span css={tw`bg-gray-400 rounded px-2 py-1 text-gray-200`}>
                                {server.isTransferring
                                    ? t('transferring')
                                    : server.status === 'installing'
                                    ? t('installing')
                                    : server.status === 'restoring_backup'
                                    ? t('restoring-backup')
                                    : t('unavailable')}
                            </span>
                        </div>
                    ) : (
                        <Spinner size={'small'} />
                    )
                ) : (
                <React.Fragment>
                    <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-300 font-light uppercase">{t('CPU')}:</span>
                        <p className={alarms.cpu ? 'text-danger-50' : ''}>{stats.cpuUsagePercent.toFixed(2)}%</p>
                        <span className="text-sm text-gray-300">/ {cpuLimit}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-300 font-light">{t('memory')}:</span>
                        <p className={alarms.memory ? 'text-danger-50' : ''}>{bytesToString(stats.memoryUsageInBytes)}</p>
                        <span className="text-sm text-gray-300">/ {memoryLimit}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-300 font-light">{t('disk')}:</span>
                        <p className={alarms.disk ? 'text-danger-50' : ''}>{bytesToString(stats.diskUsageInBytes)}</p>
                        <span className="text-sm text-gray-300">/ {diskLimit}</span>
                    </div>
                </React.Fragment>
                )}
            </div>
            <div className={'px-6 pb-5'}>
                <Link to={`/server/${server.id}`} className={'text-secondary-50 bg-secondary-200 border border-secondary-100 hover:bg-secondary-100 rounded-component px-3 py-3 w-full block text-center duration-300'}>
                    {t('manage-server', { ns: 'arix/dashboard'})}
                </Link>
            </div>
        </div>
        </>
    );
};
