import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { Icon, type IconName } from '../../components/illustration';
export default function TabsLayout(){
 const insets=useSafeAreaInsets();
 return <Tabs backBehavior="history" screenOptions={{headerShown:false,tabBarActiveTintColor:theme.colors.primary,tabBarInactiveTintColor:theme.colors.muted,tabBarLabelStyle:{fontSize:11,fontWeight:'500'},tabBarStyle:{height:58+Math.max(insets.bottom,6),paddingTop:5,paddingBottom:Math.max(insets.bottom,6),borderTopColor:theme.colors.border,backgroundColor:theme.colors.surface}}}>{[['index','Home','home'],['(browse)','Categories','categories'],['offers','Offers','offers'],['wishlist','Wishlist','heart'],['account','Account','account']].map(([name,title,icon])=><Tabs.Screen key={name} name={name} options={{title,tabBarIcon:({color,focused})=><View style={{width:44,height:28,borderRadius:10,alignItems:'center',justifyContent:'center',backgroundColor:focused?theme.colors.pale:'transparent'}}><Icon name={icon as IconName} color={color} size={21}/></View>}}/>)}<Tabs.Screen name="location" options={{tabBarButton:()=>null,tabBarItemStyle:{display:'none'}}}/></Tabs>;
}
