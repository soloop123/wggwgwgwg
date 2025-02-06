import React, { useEffect, useState} from 'react';
import { ApplicationStore } from '@/state';
import { useStoreState } from 'easy-peasy';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import LoginContainer from '@/components/auth/LoginContainer';
import ForgotPasswordContainer from '@/components/auth/ForgotPasswordContainer';
import ResetPasswordContainer from '@/components/auth/ResetPasswordContainer';
import LoginCheckpointContainer from '@/components/auth/LoginCheckpointContainer';
import { SupportIcon } from '@heroicons/react/outline';
import { FaDiscord } from "react-icons/fa";
import { NotFound } from '@/components/elements/ScreenBlock';
import { useHistory, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';

const Switches = () => {
    const { path } = useRouteMatch();
    const history = useHistory();
    const location = useLocation();

    return (
        <Switch location={location}>
            <Route path={`${path}/login`} component={LoginContainer} exact />
            <Route path={`${path}/login/checkpoint`} component={LoginCheckpointContainer} />
            <Route path={`${path}/password`} component={ForgotPasswordContainer} exact />
            <Route path={`${path}/password/reset/:token`} component={ResetPasswordContainer} />
            <Route path={`${path}/checkpoint`} />
            <Route path={'*'}>
                <NotFound onBack={() => history.push('/auth/login')} />
            </Route>
        </Switch>
    );
};

const TopBar = () => {
    const { t } = useTranslation('arix/auth');
    const [guildData, setGuildData] = useState<{ instant_invite: string } | null>(null);

    const name = useStoreState((state: ApplicationStore) => state.settings.data!.name);
    const logo = useStoreState((state: ApplicationStore) => state.settings.data!.arix.logo);
    const logoHeight = useStoreState((state: ApplicationStore) => state.settings.data!.arix.logoHeight);
    const fullLogo = useStoreState((state: ApplicationStore) => state.settings.data!.arix.fullLogo);
    const socialPosition = useStoreState((state: ApplicationStore) => state.settings.data!.arix.socialPosition);
    const logoPosition = useStoreState((state: ApplicationStore) => state.settings.data!.arix.logoPosition);
    const discord = useStoreState((state: ApplicationStore) => state.settings.data!.arix.discord);
    const support = useStoreState((state: ApplicationStore) => state.settings.data!.arix.support);

    useEffect(() => {
        const fetchData = async () => {
          try {
            const response = await fetch(`https://discord.com/api/guilds/${discord}/widget.json`);
    
            if (!response.ok) {
              throw new Error('Failed to fetch guild data');
            }
    
            const data = await response.json();
            setGuildData(data);
          } catch (error) {
            console.error('Error fetching guild data:', error);
          }
        };
    
        fetchData();
      }, []);

    return(
        <div className={'flex items-center justify-between p-5'}>
            {logoPosition == 2 &&
            <div className='flex gap-x-2 items-center font-semibold text-lg text-gray-50'>
                <img src={logo} alt={name + 'logo'} css={`height:${logoHeight};`} />
                {String(fullLogo) === 'false' && name}
            </div>}
            {socialPosition == 1 &&
                <div className={'flex gap-x-6'}>
                    {discord && <>{guildData !== null ? <a className={'flex gap-x-1 items-center duration-300 hover:text-gray-100'} href={guildData.instant_invite}><FaDiscord /> Discord</a> : <a href={''}><FaDiscord />Discord</a>}</>}
                    {support && <a className={'flex gap-x-1 items-center duration-300 hover:text-gray-100'} href={support}><SupportIcon className={'w-5'} />{t('support')}</a>}
                </div>
            }
        </div>
    )
}

const AuthContainer = () => {
    const loginBackground = useStoreState((state: ApplicationStore) => state.settings.data!.arix.loginBackground);
    const loginLayout = useStoreState((state: ApplicationStore) => state.settings.data!.arix.loginLayout);
    const loginGradient = useStoreState((state: ApplicationStore) => state.settings.data!.arix.loginGradient);

    const Gradient = () => (
        String(loginGradient) == 'true' ? <div className={'absolute inset-0 z-[-1]'} css={'background-image:radial-gradient(circle, color-mix(in srgb, var(--gray800) 45%, transparent) 0%, var(--gray800) 100%);'} /> : null
    )

    return (
        <div className={'min-h-screen h-full bg-center bg-no-repeat bg-cover z-10 relative'} css={`background-image:url(${loginLayout == 1 ? loginBackground : ''});`}>
            {loginLayout == 1 ?
            <>
            <div className={'min-h-screen flex flex-col'}>
                <TopBar />
                <Switches />
            </div>
            <Gradient />
            </>
            : loginLayout == 2 ?
            <div className={'grid lg:grid-cols-2'}>
                <div className={'flex flex-col min-h-screen h-full'}>
                    <TopBar />
                    <Switches />
                </div>
                <div className={'h-full bg-center bg-no-repeat bg-cover bg-arix z-10 relative'} css={`background-image:url(${loginBackground});`}>
                    <Gradient />
                </div>
            </div>
            : 
            <div className={'grid lg:grid-cols-2'}>
                <div className={'flex flex-col min-h-screen h-full'}>
                    <TopBar />
                    <Switches />
                </div>
                <div className={'h-full lg:p-5'}>
                    <div className={'h-full bg-center bg-no-repeat bg-cover bg-arix rounded-box overflow-hidden relative z-10'} css={`background-image:url(${loginBackground});`}>
                        <Gradient />
                    </div>
                </div>
            </div>
            }
        </div>
    );
};

export default AuthContainer;
