import * as React from 'react';
import renderer from 'react-test-renderer';
import { Text, View } from 'react-native';


it(`renders correctly`, () => {
  const tree = renderer.create(<View><Text>sadkahkdshs</Text></View>).toJSON();

  expect(tree).toMatchSnapshot();
});
