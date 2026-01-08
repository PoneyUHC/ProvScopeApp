
import { Event } from "@common/types";


export default abstract class StorageStrategy {

    abstract applyEvent(event: Event): void;
}