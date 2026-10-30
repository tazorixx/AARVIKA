import React, {useContext, useEffect, useState} from 'react';
import {Tabs, router, usePathname, type Href} from 'expo-router';
import {Animated, Pressable, Text, View, useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {MotionContext} from '../../state/motion-context';
import {GiftIcon, palette, bodyFont, type GiftIconName} from '../../components/aarvika-mobile';
import {useStore} from '../../state/store';

type MainTab = {name:string; label:string; icon:GiftIconName; href:Href};
const navItems:MainTab[] = [
  {name:'index', label:'Home', icon:'home', href:'/'},
  {name:'(browse)', label:'Categories', icon:'grid', href:'/categories'},
  {name:'offers', label:'Offers', icon:'tag', href:'/offers'},
  {name:'wishlist', label:'Wishlist', icon:'heart', href:'/wishlist'},
  {name:'account', label:'Account', icon:'user', href:'/account'},
];

/**
 * The five-tab navigation uses expo-router directly.
 * A tabBar render prop's navigation object is not reliably supplied on Web
 * in every Expo Router/React Navigation version. Do not call navigation.emit.
 * This works for nested Categories routes and preserves all existing screens.
 */
function MobileTabBar({state}:{state?:{routes?:{name:string;key:string}[];index?:number}}){
  const insets = useSafeAreaInsets();
  const store = useStore();
  const reduced = useContext(MotionContext);
  const path = usePathname();
  const [width, setWidth] = useState(390);
  const routeName = state?.routes?.[state?.index ?? 0]?.name;
  const selectedByRoute = navItems.findIndex(item=>item.name===routeName);
  // Category detail pages belong to the Categories tab as well.
  const selectedByPath = /^\/(?:categories|category(?:\/|$)|department(?:\/|$)|search(?:\/|$)|wedding(?:\/|$))/.test(path) ? 1
    : path.startsWith('/offers') ? 2
    : path.startsWith('/wishlist') ? 3
    : path.startsWith('/account') || path.startsWith('/location') ? 4
    : path === '/' || path === '/index' ? 0 : -1;
  const active = selectedByPath >= 0 ? selectedByPath : Math.max(0, selectedByRoute);
  const [indicator]=useState(()=>new Animated.Value(active));

  useEffect(()=>{
    indicator.stopAnimation();
    if (reduced) { indicator.setValue(active); return; }
    const animation = Animated.spring(indicator, {toValue:active, damping:15, stiffness:140, mass:.8, useNativeDriver:true});
    animation.start();
    return ()=>animation.stop();
  }, [active, indicator, reduced]);

  const fifth = width / navItems.length;
  return <View testID="aarvika-bottom-tabs" onLayout={event=>{
    const next = event.nativeEvent.layout.width;
    if (next>0 && Math.abs(next-width)>1) setWidth(next);
  }} style={{height:58+Math.max(insets.bottom,6),backgroundColor:'white',borderTopWidth:1,borderTopColor:palette.line,paddingTop:8,paddingBottom:Math.max(insets.bottom,6),flexDirection:'row',position:'relative'}}>
    <Animated.View pointerEvents="none" style={{position:'absolute',top:0,left:0,width:fifth,height:3,borderBottomLeftRadius:4,borderBottomRightRadius:4,backgroundColor:palette.brand2,transform:[{translateX:indicator.interpolate({inputRange:[0,1,2,3,4],outputRange:[0,fifth,2*fifth,3*fifth,4*fifth]})}]}}/>
    {navItems.map((item,i)=>{
      const focused=active===i;
      return <Pressable key={item.name} testID={`tab-${item.name}`} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{selected:focused}}
        onPress={()=>{ if(!focused || path!==item.href) router.navigate(item.href); }}
        style={({pressed})=>({flex:1,alignItems:'center',justifyContent:'center',gap:3,position:'relative',opacity:pressed?.65:1})}>
        <View style={{transform:[{translateY:focused?-3:0},{scale:focused?1.15:1}]}}>
          <GiftIcon name={item.icon} size={22} color={focused?palette.brand2:palette.muted}/>
        </View>
        <Text style={{fontFamily:bodyFont,fontSize:10,fontWeight:'700',color:focused?palette.brand2:palette.ink}}>{item.label}</Text>
        {item.name==='wishlist'&&store.profile.wishlist.length>0&&<View style={{position:'absolute',top:-3,right:'20%',minWidth:16,height:16,paddingHorizontal:3,borderRadius:9,backgroundColor:palette.gold,alignItems:'center',justifyContent:'center'}}>
          <Text style={{fontSize:9,fontWeight:'800',color:palette.ink}}>{store.profile.wishlist.length}</Text>
        </View>}
      </Pressable>;
    })}
  </View>;
}

export default function TabsLayout(){
  const {width,height}=useWindowDimensions();
  const desktop=width>=520;
  return <View style={{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#FFFFFF'}}>
    <View style={{width:'100%',maxWidth:desktop?430:undefined,height:desktop?Math.min(880,height-16):'100%',backgroundColor:'white',borderRadius:desktop?36:0,borderWidth:desktop?1:0,borderColor:palette.line,overflow:'hidden',shadowColor:palette.brand,shadowOffset:{width:0,height:25},shadowOpacity:desktop?.2:0,shadowRadius:40,elevation:desktop?8:0}}>
      <Tabs backBehavior="history" tabBar={props=><MobileTabBar state={props.state}/>} screenOptions={{headerShown:false}}>
        <Tabs.Screen name="index" options={{title:'Home'}}/>
        <Tabs.Screen name="(browse)" options={{title:'Categories'}}/>
        <Tabs.Screen name="offers" options={{title:'Offers'}}/>
        <Tabs.Screen name="wishlist" options={{title:'Wishlist'}}/>
        <Tabs.Screen name="account" options={{title:'Account'}}/>
        <Tabs.Screen name="location" options={{tabBarButton:()=>null}}/>
      </Tabs>
    </View>
  </View>;
}
