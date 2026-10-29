import {useState} from 'react';
import {Platform,View} from 'react-native';
import {discoveryQuery} from '../../../domain/discovery-query';
import {VisualSearch} from '../../../components/visual-search';
import {router,useLocalSearchParams} from 'expo-router';
import { Page,Button,styles } from '../../../components/ui';
import { CatalogBrowser } from '../../../components/catalog-browser';
export default function Search() { const [filtersOpen,setFiltersOpen]=useState(false); const params=useLocalSearchParams<Record<string,string>>(),{visual}=params,filters=discoveryQuery(params);return <Page title="Search" back sideRailActive={filters.departmentId} footer={Platform.OS!=='web'?<View style={styles.row}><Button title="Filters" icon="filter" secondary onPress={()=>setFiltersOpen(true)}/><Button title="Sort designs" secondary onPress={()=>setFiltersOpen(true)}/></View>:undefined}><VisualSearch visible={visual==='1'} onClose={()=>router.setParams({visual:undefined})}/><CatalogBrowser premium filterSheet={filtersOpen} onFilterSheetChange={setFiltersOpen} filters={filters} /></Page>; }
